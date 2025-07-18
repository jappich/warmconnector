// scripts/loadIntoNeo4j.js
import neo4j from 'neo4j-driver';
import mongoose from 'mongoose';

// MongoDB UserProfile schema structure
const UserProfileSchema = new mongoose.Schema({
  oktaId: String,
  name: String,
  email: String,
  company: String,
  title: String,
  socialProfiles: Array,
  education: Array,
  greekLife: Object,
  family: Array,
  hometowns: Array,
  directory: Array,
  demo: Boolean
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

async function main() {
  try {
    // 1. Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 2. Connect to Neo4j
    if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
      throw new Error('Neo4j connection variables (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD) are required');
    }
    
    const driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
    const session = driver.session();
    console.log('Connected to Neo4j');

    // 3. Clear existing data
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Cleared existing Neo4j data');

    // 4. Load all profiles from MongoDB
    const people = await UserProfile.find();
    console.log(`Loaded ${people.length} profiles from MongoDB`);

    if (people.length === 0) {
      console.log('No profiles found in MongoDB. Please ensure data exists.');
      await session.close();
      await driver.close();
      await mongoose.disconnect();
      return;
    }

    // 5. Create Person nodes
    for (const p of people) {
      await session.run(
        `
        MERGE (person:Person { oktaId: $oktaId })
        ON CREATE SET
          person.name = $name,
          person.email = $email,
          person.company = $company,
          person.title = $title,
          person.socialProfiles = $socialProfiles,
          person.education = $education,
          person.family = $family,
          person.hometowns = $hometowns,
          person.greekLife = $greekLife
        ON MATCH SET
          person.name = $name,
          person.email = $email,
          person.company = $company,
          person.title = $title,
          person.socialProfiles = $socialProfiles,
          person.education = $education,
          person.family = $family,
          person.hometowns = $hometowns,
          person.greekLife = $greekLife
        `,
        {
          oktaId: p.oktaId || p._id.toString(),
          name: p.name,
          email: p.email,
          company: p.company,
          title: p.title,
          socialProfiles: JSON.stringify(p.socialProfiles || []),
          education: JSON.stringify(p.education || []),
          family: JSON.stringify(p.family || []),
          hometowns: JSON.stringify(p.hometowns || []),
          greekLife: p.greekLife ? JSON.stringify(p.greekLife) : null
        }
      );
    }
    console.log('All Person nodes created/merged in Neo4j');

    // 6. Create COWORKER relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.company = b.company 
        AND a.company IS NOT NULL 
        AND b.company IS NOT NULL
        AND a.oktaId < b.oktaId
      MERGE (a)-[:COWORKER { strength: 0.7, metadata: a.company }]->(b)
      MERGE (b)-[:COWORKER { strength: 0.7, metadata: a.company }]->(a)
    `);
    console.log('COWORKER relationships created');

    // 7. Create EDUCATION relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.education IS NOT NULL 
        AND b.education IS NOT NULL
        AND a.oktaId < b.oktaId
      WITH a, b, 
           [school IN apoc.convert.fromJsonList(a.education) | toLower(school.school)] AS aSchools,
           [school IN apoc.convert.fromJsonList(b.education) | toLower(school.school)] AS bSchools
      WHERE any(school IN aSchools WHERE school IN bSchools)
      MERGE (a)-[:EDUCATION { strength: 0.5 }]->(b)
      MERGE (b)-[:EDUCATION { strength: 0.5 }]->(a)
    `);
    console.log('EDUCATION relationships created');

    // 8. Create FAMILY relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.family IS NOT NULL 
        AND b.family IS NOT NULL
        AND a.oktaId < b.oktaId
      WITH a, b,
           [rel IN apoc.convert.fromJsonList(a.family) | rel.oktaId] AS aFamily,
           [rel IN apoc.convert.fromJsonList(b.family) | rel.oktaId] AS bFamily
      WHERE b.oktaId IN aFamily OR a.oktaId IN bFamily
      MERGE (a)-[:FAMILY { strength: 0.9 }]->(b)
      MERGE (b)-[:FAMILY { strength: 0.9 }]->(a)
    `);
    console.log('FAMILY relationships created');

    // 9. Create GREEK_LIFE relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.greekLife IS NOT NULL 
        AND b.greekLife IS NOT NULL
        AND a.oktaId < b.oktaId
      WITH a, b,
           apoc.convert.fromJsonMap(a.greekLife) AS aGreek,
           apoc.convert.fromJsonMap(b.greekLife) AS bGreek
      WHERE aGreek.org = bGreek.org AND aGreek.chapter = bGreek.chapter
      MERGE (a)-[:GREEK_LIFE { strength: 0.8, org: aGreek.org, chapter: aGreek.chapter }]->(b)
      MERGE (b)-[:GREEK_LIFE { strength: 0.8, org: aGreek.org, chapter: aGreek.chapter }]->(a)
    `);
    console.log('GREEK_LIFE relationships created');

    // 10. Create HOMETOWN relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.hometowns IS NOT NULL 
        AND b.hometowns IS NOT NULL
        AND a.oktaId < b.oktaId
      WITH a, b,
           [ht IN apoc.convert.fromJsonList(a.hometowns) | ht.city + "_" + ht.state + "_" + ht.country] AS aHometowns,
           [ht IN apoc.convert.fromJsonList(b.hometowns) | ht.city + "_" + ht.state + "_" + ht.country] AS bHometowns
      WHERE any(hometown IN aHometowns WHERE hometown IN bHometowns)
      MERGE (a)-[:HOMETOWN { strength: 0.4 }]->(b)
      MERGE (b)-[:HOMETOWN { strength: 0.4 }]->(a)
    `);
    console.log('HOMETOWN relationships created');

    // 11. Create SOCIAL relationships
    await session.run(`
      MATCH (a:Person), (b:Person)
      WHERE a.socialProfiles IS NOT NULL 
        AND b.socialProfiles IS NOT NULL
        AND a.oktaId < b.oktaId
      WITH a, b,
           [sp IN apoc.convert.fromJsonList(a.socialProfiles) WHERE sp.handle IS NOT NULL | sp.provider + "_" + sp.handle] AS aSocial,
           [sp IN apoc.convert.fromJsonList(b.socialProfiles) WHERE sp.handle IS NOT NULL | sp.provider + "_" + sp.handle] AS bSocial
      WHERE any(social IN aSocial WHERE social IN bSocial)
      MERGE (a)-[:SOCIAL { strength: 0.3 }]->(b)
      MERGE (b)-[:SOCIAL { strength: 0.3 }]->(a)
    `);
    console.log('SOCIAL relationships created');

    // 12. Get final statistics
    const nodeCount = await session.run('MATCH (n:Person) RETURN count(n) as count');
    const edgeCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
    const relationshipTypes = await session.run(`
      MATCH ()-[r]->() 
      RETURN type(r) as relType, count(r) as count 
      ORDER BY count DESC
    `);

    console.log(`\nNeo4j Import Complete!`);
    console.log(`Nodes: ${nodeCount.records[0].get('count')}`);
    console.log(`Edges: ${edgeCount.records[0].get('count')}`);
    console.log(`Relationship Types:`);
    relationshipTypes.records.forEach(record => {
      console.log(`  ${record.get('relType')}: ${record.get('count')}`);
    });

    // 13. Close connections
    await session.close();
    await driver.close();
    await mongoose.disconnect();
    console.log('Neo4j import complete - all connections closed');
    
  } catch (error) {
    console.error('Error loading data into Neo4j:', error);
    process.exit(1);
  }
}

export { main as loadIntoNeo4j };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => process.exit(0));
}