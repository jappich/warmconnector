const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class JLLScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.people = [];
    this.outputFile = path.join(__dirname, 'jll_people.json');
  }

  async init() {
    console.log('Starting JLL People scraper...');
    this.browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async scrapeListPage() {
    console.log('Navigating to JLL People page...');
    await this.page.goto('https://www.jll.com/en-us/people', { waitUntil: 'networkidle2' });
    
    console.log('Loading all people cards...');
    await this.scrollAndLoadAll();
    
    console.log('Extracting person cards...');
    const peopleCards = await this.page.$$eval('[data-testid="person-card"], .person-card, .people-card', cards => {
      return cards.map(card => {
        const nameElement = card.querySelector('h3, .name, [data-testid="person-name"]');
        const titleElement = card.querySelector('.title, .position, [data-testid="person-title"]');
        const locationElement = card.querySelector('.location, .office, [data-testid="person-location"]');
        const linkElement = card.querySelector('a');
        
        return {
          name: nameElement ? nameElement.textContent.trim() : '',
          title: titleElement ? titleElement.textContent.trim() : '',
          location: locationElement ? locationElement.textContent.trim() : '',
          profileUrl: linkElement ? linkElement.href : ''
        };
      }).filter(person => person.name && person.profileUrl);
    });

    console.log(`Found ${peopleCards.length} people cards`);
    return peopleCards;
  }

  async scrollAndLoadAll() {
    let previousHeight = 0;
    let currentHeight = await this.page.evaluate('document.body.scrollHeight');
    
    while (previousHeight !== currentHeight) {
      previousHeight = currentHeight;
      
      // Scroll to bottom
      await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      
      // Wait for new content to load
      await this.page.waitForTimeout(2000);
      
      // Check for "Load More" button and click if present
      try {
        const loadMoreButton = await this.page.$('button[data-testid="load-more"], .load-more, .show-more');
        if (loadMoreButton) {
          await loadMoreButton.click();
          await this.page.waitForTimeout(3000);
        }
      } catch (error) {
        // No load more button found, continue scrolling
      }
      
      currentHeight = await this.page.evaluate('document.body.scrollHeight');
    }
  }

  async scrapePersonProfile(profileUrl) {
    const profilePage = await this.browser.newPage();
    
    try {
      await profilePage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await profilePage.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const profileData = await profilePage.evaluate(() => {
        // Email extraction
        const emailElement = document.querySelector('[href^="mailto:"], .email, [data-testid="email"]');
        const email = emailElement ? emailElement.textContent.trim() || emailElement.href.replace('mailto:', '') : '';
        
        // Phone extraction
        const phoneElement = document.querySelector('[href^="tel:"], .phone, [data-testid="phone"]');
        const phone = phoneElement ? phoneElement.textContent.trim() || phoneElement.href.replace('tel:', '') : '';
        
        // Bio extraction
        const bioElement = document.querySelector('.bio, .description, .about, [data-testid="bio"]');
        const bio = bioElement ? bioElement.textContent.trim() : '';
        
        // LinkedIn extraction
        const linkedinElement = document.querySelector('[href*="linkedin.com"], .linkedin, [data-testid="linkedin"]');
        const linkedin = linkedinElement ? linkedinElement.href : '';
        
        // Twitter extraction
        const twitterElement = document.querySelector('[href*="twitter.com"], .twitter, [data-testid="twitter"]');
        const twitter = twitterElement ? twitterElement.href : '';
        
        // Education extraction
        const educationElements = document.querySelectorAll('.education li, .education-item, [data-testid="education-item"]');
        const education = Array.from(educationElements).map(elem => {
          const text = elem.textContent.trim();
          const yearMatch = text.match(/(\d{4})/);
          const school = text.replace(/\d{4}/g, '').trim();
          return {
            school: school || text,
            year: yearMatch ? parseInt(yearMatch[1]) : null
          };
        }).filter(edu => edu.school);
        
        // Family extraction (if available)
        const familyElements = document.querySelectorAll('.family li, .family-member, [data-testid="family-member"]');
        const family = Array.from(familyElements).map(elem => {
          const text = elem.textContent.trim();
          return {
            name: text,
            relation: 'family' // Generic relation as specific relations may not be available
          };
        }).filter(fam => fam.name);
        
        // Hometowns extraction
        const locationElements = document.querySelectorAll('.location, .hometown, .office-location, [data-testid="location"]');
        const hometowns = Array.from(locationElements).map(elem => {
          const text = elem.textContent.trim();
          const parts = text.split(',').map(part => part.trim());
          return {
            city: parts[0] || '',
            country: parts[parts.length - 1] || '',
            state: parts.length > 2 ? parts[1] : ''
          };
        }).filter(hometown => hometown.city);
        
        return {
          email,
          phone,
          bio,
          linkedin,
          twitter,
          education,
          family,
          hometowns
        };
      });
      
      return profileData;
      
    } catch (error) {
      console.error(`Error scraping profile ${profileUrl}:`, error.message);
      return {
        email: '',
        phone: '',
        bio: '',
        linkedin: '',
        twitter: '',
        education: [],
        family: [],
        hometowns: []
      };
    } finally {
      await profilePage.close();
    }
  }

  async scrapeAllProfiles(peopleCards) {
    console.log(`Starting to scrape ${peopleCards.length} individual profiles...`);
    
    for (let i = 0; i < peopleCards.length; i++) {
      const person = peopleCards[i];
      console.log(`Scraping profile ${i + 1}/${peopleCards.length}: ${person.name}`);
      
      // Throttle requests to be respectful
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      const profileData = await this.scrapePersonProfile(person.profileUrl);
      
      const fullPersonData = {
        ...person,
        ...profileData,
        scrapedAt: new Date().toISOString()
      };
      
      this.people.push(fullPersonData);
      
      // Save incrementally every 50 profiles
      if ((i + 1) % 50 === 0) {
        await this.saveToFile();
        console.log(`Saved progress: ${i + 1} profiles scraped`);
      }
    }
    
    await this.saveToFile();
    console.log(`Scraping complete! Total profiles: ${this.people.length}`);
  }

  async saveToFile() {
    const data = {
      scrapedAt: new Date().toISOString(),
      totalProfiles: this.people.length,
      people: this.people
    };
    
    fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
  }

  async run() {
    try {
      await this.init();
      
      const peopleCards = await this.scrapeListPage();
      
      if (peopleCards.length === 0) {
        console.log('No people cards found. Please check the CSS selectors.');
        return;
      }
      
      await this.scrapeAllProfiles(peopleCards);
      
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the scraper
const scraper = new JLLScraper();
scraper.run().then(() => {
  console.log('JLL scraping completed!');
  process.exit(0);
}).catch(error => {
  console.error('Scraping error:', error);
  process.exit(1);
});