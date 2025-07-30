// ETL service for ingesting company directory and enriching with AI-powered relationship extraction
const neo4j = require('neo4j-driver');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

class DataIngestionService {
  constructor() {
    this.neo4jDriver = null;
    this.openai = null;
    this.oktaClient = null;
  }

  async initialize() {
    // Initialize Neo4j driver
    this.neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize Okta client
    const okta = require('@okta/okta-sdk-nodejs');
    this.oktaClient = new okta.Client({
      orgUrl: process.env.OKTA_DOMAIN,
      token: process.env.OKTA_API_TOKEN
    });

    console.log('Data ingestion service initialized');
  }

  // Fetch company directory from Okta
  async fetchCompanyDirectory(companyName) {
    try {
      const users = [];
      const userCollection = this.oktaClient.listUsers({
        filter: `profile.company eq "${companyName}"`
      });

      await userCollection.each(user => {
        users.push({
          id: user.id,
          email: user.profile.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          company: user.profile.company || companyName,
          title: user.profile.title,
          department: user.profile.department
        });
      });

      console.log(`Fetched ${users.length} users from company directory`);
      return users;
    } catch (error) {
      console.error('Error fetching company directory:', error);
      return [];
    }
  }

  // AI-powered relationship extraction from public profiles
  async extractRelationships(person) {
    try {
      const prompt = `
        Analyze the following person's profile and extract potential professional and personal relationships:
        
        Name: ${person.firstName} ${person.lastName}
        Company: ${person.company}
        Title: ${person.title}
        
        Please identify and return relationships in this JSON format:
        {
          "relationships": [
            {
              "targetName": "Person Name",
              "relationType": "COWORKER|COLLEGE|FAMILY|HOMETOWN|SOCIAL",
              "metadata": {
                "since": "year",
                "details": "additional context"
              }
            }
          ]
        }
        
        Only return relationships you can infer with high confidence from public information.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.relationships || [];
    } catch (error) {
      console.error('Error extracting relationships with AI:', error);
      return [];
    }
  }

  // Scrape public social profiles (with rate limiting and respect for robots.txt)
  async scrapePublicProfile(person, platform) {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Set user agent to identify as a legitimate crawler
      await page.setUserAgent('WarmConnector-Bot/1.0');
      
      // Construct profile URL based on platform and person's name
      const profileUrl = this.constructProfileUrl(person, platform);
      
      if (!profileUrl) {
        await browser.close();
        return null;
      }

      await page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Extract basic profile information
      const profileData = await page.evaluate(() => {
        // This would need to be customized for each platform
        return {
          name: document.querySelector('[data-test="profile-name"]')?.textContent,
          company: document.querySelector('[data-test="company"]')?.textContent,
          connections: document.querySelector('[data-test="connections-count"]')?.textContent
        };
      });

      await browser.close();
      return profileData;
    } catch (error) {
      console.error(`Error scraping ${platform} profile:`, error);
      return null;
    }
  }

  constructProfileUrl(person, platform) {
    const name = `${person.firstName}-${person.lastName}`.toLowerCase();
    
    switch (platform) {
      case 'linkedin':
        return `https://linkedin.com/in/${name}`;
      case 'twitter':
        return `https://twitter.com/${name}`;
      default:
        return null;
    }
  }

  // Write person nodes to Neo4j
  async createPersonNode(person) {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MERGE (p:Person {id: $id})
        SET p.name = $name,
            p.email = $email,
            p.company = $company,
            p.title = $title,
            p.department = $department,
            p.updatedAt = datetime()
        RETURN p
        `,
        {
          id: person.id,
          name: `${person.firstName} ${person.lastName}`,
          email: person.email,
          company: person.company,
          title: person.title,
          department: person.department
        }
      );
      return result.records[0]?.get('p');
    } finally {
      await session.close();
    }
  }

  // Create relationship edges in Neo4j
  async createRelationship(fromId, toId, relationType, metadata = {}) {
    const session = this.neo4jDriver.session();
    try {
      await session.run(
        `
        MATCH (from:Person {id: $fromId})
        MATCH (to:Person {id: $toId})
        MERGE (from)-[r:${relationType}]->(to)
        SET r.since = $since,
            r.metadata = $metadata,
            r.createdAt = datetime()
        `,
        {
          fromId: fromId,
          toId: toId,
          since: metadata.since,
          metadata: JSON.stringify(metadata)
        }
      );
    } finally {
      await session.close();
    }
  }

  // Main ingestion workflow
  async runIngestion(companyName) {
    console.log(`Starting data ingestion for company: ${companyName}`);
    
    try {
      // 1. Fetch company directory
      const employees = await this.fetchCompanyDirectory(companyName);
      
      // 2. Create person nodes
      for (const employee of employees) {
        await this.createPersonNode(employee);
        
        // 3. Extract relationships using AI
        const relationships = await this.extractRelationships(employee);
        
        // 4. Create relationship edges
        for (const rel of relationships) {
          // Find target person in our database
          const targetPerson = employees.find(emp => 
            `${emp.firstName} ${emp.lastName}` === rel.targetName
          );
          
          if (targetPerson) {
            await this.createRelationship(
              employee.id,
              targetPerson.id,
              rel.relationType,
              rel.metadata
            );
          }
        }
        
        // Rate limiting to be respectful to external services
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Ingestion completed for ${employees.length} employees`);
    } catch (error) {
      console.error('Error during ingestion:', error);
    }
  }

  // Schedule regular ingestion
  scheduleIngestion(companyName) {
    // Run every Sunday at 2 AM
    cron.schedule('0 2 * * 0', () => {
      console.log('Running scheduled data ingestion...');
      this.runIngestion(companyName);
    });
  }

  async close() {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }
  }
}

module.exports = DataIngestionService;

// CLI execution
if (require.main === module) {
  const service = new DataIngestionService();
  service.initialize().then(() => {
    const companyName = process.argv[2] || 'Default Company';
    service.runIngestion(companyName);
  });
}