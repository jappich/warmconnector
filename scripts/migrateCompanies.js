import { db } from '../server/db.ts';
import { companies, persons } from '../shared/schema.ts';
import { sql } from 'drizzle-orm';

async function migrateCompaniesToFirstClassEntities() {
  console.log('🏢 Starting company migration...');
  
  try {
    // Get unique companies from persons table
    const uniqueCompanies = await db.execute(sql`
      SELECT DISTINCT company, COUNT(*) as employee_count
      FROM persons 
      WHERE company IS NOT NULL 
      AND company != ''
      GROUP BY company
      ORDER BY employee_count DESC
    `);

    console.log(`Found ${uniqueCompanies.rows.length} unique companies in persons table`);

    // Default locations for well-known companies
    const companyLocations = {
      'Google': { city: 'Mountain View', state: 'CA', country: 'USA', domain: 'google.com' },
      'Microsoft': { city: 'Redmond', state: 'WA', country: 'USA', domain: 'microsoft.com' },
      'Apple': { city: 'Cupertino', state: 'CA', country: 'USA', domain: 'apple.com' },
      'Amazon': { city: 'Seattle', state: 'WA', country: 'USA', domain: 'amazon.com' },
      'Meta': { city: 'Menlo Park', state: 'CA', country: 'USA', domain: 'meta.com' },
      'Tesla': { city: 'Austin', state: 'TX', country: 'USA', domain: 'tesla.com' },
      'Netflix': { city: 'Los Gatos', state: 'CA', country: 'USA', domain: 'netflix.com' },
      'Salesforce': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'salesforce.com' },
      'Oracle': { city: 'Austin', state: 'TX', country: 'USA', domain: 'oracle.com' },
      'Adobe': { city: 'San Jose', state: 'CA', country: 'USA', domain: 'adobe.com' },
      'Uber': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'uber.com' },
      'Airbnb': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'airbnb.com' },
      'Stripe': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'stripe.com' },
      'Zoom': { city: 'San Jose', state: 'CA', country: 'USA', domain: 'zoom.us' },
      'Slack': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'slack.com' },
      'JLL': { city: 'Chicago', state: 'IL', country: 'USA', domain: 'jll.com' },
      'WarmConnector': { city: 'San Francisco', state: 'CA', country: 'USA', domain: 'warmconnector.com' }
    };

    let migratedCount = 0;
    let skippedCount = 0;

    for (const row of uniqueCompanies.rows) {
      const companyName = row.company;
      
      // Check if company already exists
      const existingCompany = await db.select()
        .from(companies)
        .where(sql`name = ${companyName}`)
        .limit(1);

      if (existingCompany.length > 0) {
        skippedCount++;
        continue;
      }

      // Get location data or use defaults
      const locationData = companyLocations[companyName] || {
        city: 'San Francisco',
        state: 'CA', 
        country: 'USA',
        domain: null
      };

      // Insert company
      await db.insert(companies).values({
        name: companyName,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        domain: locationData.domain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        allow_all: false,
        status: 'active'
      });

      migratedCount++;
      console.log(`✅ Created company: ${companyName} (${row.employee_count} employees)`);
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`- Created: ${migratedCount} companies`);
    console.log(`- Skipped (already exists): ${skippedCount} companies`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCompaniesToFirstClassEntities()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateCompaniesToFirstClassEntities };