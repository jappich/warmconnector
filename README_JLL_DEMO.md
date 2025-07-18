# Demo with JLL Data

This system provides automated data ingestion from JLL's public people directory, enabling immediate demonstration with 5,000+ real professional profiles without requiring manual onboarding.

## Quick Setup for Demo

### 1. Scrape JLL People Data

First, run the scraper to collect professional profiles:

```bash
node scripts/scrapeJLL.js
```

**Expected Duration:** 10-15 minutes for full dataset
**Output:** `scripts/jll_people.json` with structured profile data

The scraper automatically:
- Navigates to JLL's people directory
- Loads all person cards through infinite scrolling
- Extracts detailed profile information including contact details, education, and social profiles
- Implements respectful throttling (1 second between requests)

### 2. Import to Database

Set your MongoDB connection in Replit Secrets:
- Key: `MONGODB_URI`
- Value: Your MongoDB Atlas connection string

Then import the scraped data:

```bash
node scripts/importJLL.js
```

This will:
- Connect to your MongoDB database
- Import all JLL profiles with structured data mapping
- Create proper social profiles, education, and family relationships
- Set onboarding status as completed for all profiles

### 3. Enable Demo Mode

Set demo bypass in Replit Secrets:
- Key: `DEMO_SKIP_ONBOARDING`
- Value: `true`

This allows immediate access to Find Intro functionality without manual onboarding.

### 4. Rebuild Professional Network Graph

Trigger the graph rebuild to establish relationships:

```bash
curl -X GET https://your-app-url.replit.app/api/rebuild-graph
```

Or navigate to `/api/rebuild-graph` in your browser after authentication.

This creates:
- Colleague relationships between all JLL employees
- Professional network mappings for connection discovery
- Optimized graph structure for shortest-path algorithms

## Data Structure

The system imports comprehensive professional data:

### Profile Information
- **Basic Details:** Name, title, location, contact information
- **Social Profiles:** LinkedIn, Twitter, and other professional networks
- **Education:** University, degree, graduation year
- **Professional History:** Previous roles and company affiliations

### Relationship Mapping
- **Colleague Networks:** Automatic connections within JLL
- **Educational Connections:** Alumni relationships
- **Geographic Proximity:** Location-based networking opportunities
- **Industry Relationships:** Cross-functional professional connections

## Using the Demo

Once setup is complete:

1. **Navigate to Find Intro:** Users are automatically redirected to `/find-intro`
2. **Search Target Connections:** Search through 5,000+ JLL professionals
3. **Discover Introduction Paths:** AI-powered analysis finds optimal networking routes
4. **Request Introductions:** Streamlined process for warm connection requests

## Performance Optimization

### Scraping Efficiency
- Headless browser operation for faster processing
- Incremental saving every 50 profiles to prevent data loss
- Automatic retry logic for failed requests
- Respectful rate limiting to avoid server overload

### Database Performance
- Bulk import operations for faster processing
- Indexed fields for rapid search capabilities
- Optimized schema for relationship queries
- Automatic duplicate detection and updates

### Graph Processing
- Efficient relationship mapping algorithms
- Cached shortest-path calculations
- Optimized for large-scale professional networks
- Real-time connection discovery

## Troubleshooting

### Common Issues

**Scraper fails to find profiles:**
- JLL may have updated their website structure
- Check CSS selectors in `scrapeJLL.js`
- Verify the base URL is still accessible

**Import fails:**
- Ensure MONGODB_URI is correctly set in Secrets
- Verify MongoDB Atlas allows connections from Replit
- Check that `jll_people.json` exists and is valid JSON

**Demo mode not working:**
- Confirm DEMO_SKIP_ONBOARDING is set to 'true' in Secrets
- Restart the application after setting environment variables
- Check authentication flow is properly configured

### Data Quality

The system includes validation for:
- Email format verification
- Professional title standardization
- Location data normalization
- Social profile URL validation
- Education history formatting

## Extending the System

### Additional Data Sources
The scraping framework can be adapted for other professional directories:
- Company employee pages
- Professional association member lists
- Industry conference attendee directories
- Alumni network databases

### Enhanced Relationship Detection
Future improvements can include:
- Advanced alumni network mapping
- Industry conference co-attendance tracking
- Professional certification connections
- Geographic proximity algorithms

This demo system provides a comprehensive foundation for testing advanced professional networking features with authentic data from a major real estate services company.