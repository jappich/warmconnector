const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define UserProfile schema to match the existing model
const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  oktaId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String },
  bio: { type: String },
  phone: { type: String },
  
  // Enhanced social profiles with structured format
  socialProfiles: {
    linkedin: { type: String, default: '' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    other: { type: String, default: '' }
  },
  
  // Structured education information
  education: {
    school: { type: String, default: '' },
    degree: { type: String, default: '' },
    year: { type: Number, default: null }
  },
  
  // Greek life/fraternity information
  greekLife: {
    org: { type: String, default: '' },
    chapter: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  
  // Family member information
  family: {
    spouse: { type: String, default: '' },
    children: { type: [String], default: [] },
    siblings: { type: [String], default: [] }
  },
  
  // Structured hometown information
  hometowns: [{
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' }
  }],
  
  // Company directory from scraping
  orgDirectory: [{
    id: String,
    name: String,
    email: String,
    title: String,
    department: String
  }],
  
  // Onboarding completion tracking
  onboardingStatus: {
    companyDirectoryImported: { type: Boolean, default: true },
    socialProfilesConnected: { type: Boolean, default: true },
    personalInfoCompleted: { type: Boolean, default: true },
    completedAt: { type: Date, default: Date.now }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

async function importJLLData() {
  const dataFile = path.join(__dirname, 'jll_people.json');
  
  if (!fs.existsSync(dataFile)) {
    console.error('JLL data file not found. Please run the scraper first: npm run scrape:jll');
    process.exit(1);
  }
  
  console.log('Reading JLL people data...');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const people = data.people || [];
  
  console.log(`Found ${people.length} people to import`);
  
  let imported = 0;
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    
    try {
      // Use email as both userId and oktaId for demo purposes
      const userId = person.email || `jll_user_${i}`;
      const oktaId = person.email || `jll_demo_${i}`;
      
      // Map scraped data to UserProfile format
      const profileData = {
        userId,
        oktaId,
        email: person.email || `demo_${i}@jll.com`,
        name: person.name,
        company: 'JLL',
        title: person.title || '',
        bio: person.bio || '',
        phone: person.phone || '',
        
        socialProfiles: {
          linkedin: person.linkedin || '',
          facebook: '',
          twitter: person.twitter || '',
          instagram: '',
          other: ''
        },
        
        // Map first education entry if available
        education: person.education && person.education.length > 0 ? {
          school: person.education[0].school || '',
          degree: person.education[0].degree || '',
          year: person.education[0].year || null
        } : {
          school: '',
          degree: '',
          year: null
        },
        
        greekLife: {
          org: '',
          chapter: '',
          role: ''
        },
        
        // Map family data if available
        family: {
          spouse: '',
          children: person.family ? person.family.filter(f => f.relation === 'child').map(f => f.name) : [],
          siblings: person.family ? person.family.filter(f => f.relation === 'sibling').map(f => f.name) : []
        },
        
        // Map hometowns
        hometowns: person.hometowns || [],
        
        orgDirectory: [], // Will be populated by graph rebuild
        
        onboardingStatus: {
          companyDirectoryImported: true,
          socialProfilesConnected: true,
          personalInfoCompleted: true,
          completedAt: new Date()
        },
        
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Upsert the profile
      const result = await UserProfile.findOneAndUpdate(
        { email: profileData.email },
        profileData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      if (result.isNew) {
        imported++;
      } else {
        updated++;
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1}/${people.length} profiles (${imported} imported, ${updated} updated, ${errors} errors)`);
      }
      
    } catch (error) {
      console.error(`Error importing ${person.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Total processed: ${people.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  console.log('Starting JLL data import...');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }
  
  await connectDB();
  await importJLLData();
  
  console.log('Closing database connection...');
  await mongoose.connection.close();
  
  console.log('JLL data import completed successfully!');
  console.log('Next steps:');
  console.log('1. Set DEMO_SKIP_ONBOARDING=true in your environment');
  console.log('2. Trigger graph rebuild via GET /api/rebuild-graph');
  console.log('3. Navigate to /find-intro to demo with JLL data');
}

main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});