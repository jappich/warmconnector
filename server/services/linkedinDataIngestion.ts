import axios from 'axios';
import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface LinkedInProfile {
  id: string;
  firstName: { localized: { [key: string]: string } };
  lastName: { localized: { [key: string]: string } };
  headline?: { localized: { [key: string]: string } };
  industry?: { localized: { [key: string]: string } };
  location?: { name: string };
  profilePicture?: {
    displayImage: string;
  };
}

export interface LinkedInConnection {
  id: string;
  firstName: { localized: { [key: string]: string } };
  lastName: { localized: { [key: string]: string } };
  headline?: { localized: { [key: string]: string } };
  industry?: { localized: { [key: string]: string } };
}

export class LinkedInDataIngestion {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserProfile(): Promise<LinkedInProfile | null> {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        params: {
          projection: '(id,firstName,lastName,headline,industry,location,profilePicture(displayImage~:playableStreams))'
        }
      });

      return response.data;
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      return null;
    }
  }

  async getUserConnections(): Promise<LinkedInConnection[]> {
    try {
      // Note: LinkedIn API v2 has restricted connection access
      // This endpoint requires special partnership approval
      const response = await axios.get('https://api.linkedin.com/v2/connections', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        params: {
          projection: '(elements*(to~(id,firstName,lastName,headline,industry)))',
          count: 50
        }
      });

      return response.data.elements?.map((conn: any) => conn.to) || [];
    } catch (error) {
      console.error('LinkedIn connections fetch error:', error);
      // Return empty array instead of throwing to continue with profile ingestion
      return [];
    }
  }

  async ingestUserProfile(userId: string): Promise<{
    profilesIngested: number;
    connectionsFound: number;
    relationshipsCreated: number;
    errors: string[];
  }> {
    const result = {
      profilesIngested: 0,
      connectionsFound: 0,
      relationshipsCreated: 0,
      errors: [] as string[]
    };

    try {
      // Get user's LinkedIn profile
      const profile = await this.getUserProfile();
      if (!profile) {
        result.errors.push('Failed to fetch LinkedIn profile');
        return result;
      }

      // Extract profile data
      const firstName = this.getLocalizedValue(profile.firstName?.localized);
      const lastName = this.getLocalizedValue(profile.lastName?.localized);
      const name = `${firstName} ${lastName}`.trim();
      const headline = this.getLocalizedValue(profile.headline?.localized) || '';
      const industry = this.getLocalizedValue(profile.industry?.localized) || '';
      const location = profile.location?.name || '';

      // Store or update the user's profile
      const existingPerson = await db.select().from(persons).where(eq(persons.linkedinId, profile.id)).limit(1);
      
      if (existingPerson.length === 0) {
        await db.insert(persons).values({
          id: `linkedin_${profile.id}`,
          name,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@linkedin.com`,
          company: this.extractCompanyFromHeadline(headline),
          title: headline,
          location: location || undefined,
          linkedinId: profile.id,
          linkedinUrl: `https://www.linkedin.com/in/${profile.id}`,
          industry,
          skills: [],
          connections: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        result.profilesIngested++;
      }

      // Get user's connections
      const connections = await this.getUserConnections();
      result.connectionsFound = connections.length;

      // Process connections
      for (const connection of connections) {
        try {
          const connFirstName = this.getLocalizedValue(connection.firstName?.localized);
          const connLastName = this.getLocalizedValue(connection.lastName?.localized);
          const connName = `${connFirstName} ${connLastName}`.trim();
          const connHeadline = this.getLocalizedValue(connection.headline?.localized) || '';
          const connIndustry = this.getLocalizedValue(connection.industry?.localized) || '';

          // Store connection profile
          const existingConnection = await db.select().from(persons).where(eq(persons.linkedinId, connection.id)).limit(1);
          
          if (existingConnection.length === 0) {
            await db.insert(persons).values({
              id: `linkedin_${connection.id}`,
              name: connName,
              email: `${connFirstName.toLowerCase()}.${connLastName.toLowerCase()}@linkedin.com`,
              company: this.extractCompanyFromHeadline(connHeadline),
              title: connHeadline,
              linkedinId: connection.id,
              linkedinUrl: `https://www.linkedin.com/in/${connection.id}`,
              industry: connIndustry,
              skills: [],
              connections: [],
              createdAt: new Date(),
              updatedAt: new Date()
            });
            result.profilesIngested++;
          }

          // Create relationship
          const existingRelationship = await db.select().from(relationships)
            .where(eq(relationships.fromId, `linkedin_${profile.id}`))
            .where(eq(relationships.toId, `linkedin_${connection.id}`))
            .limit(1);

          if (existingRelationship.length === 0) {
            await db.insert(relationships).values({
              fromId: `linkedin_${profile.id}`,
              toId: `linkedin_${connection.id}`,
              type: 'linkedin_connection',
              confidenceScore: 75,
              createdAt: new Date(),
            });
            result.relationshipsCreated++;
          }
        } catch (error) {
          result.errors.push(`Failed to process connection ${connection.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      result.errors.push(`Profile ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async syncCompanyEmployees(companyId: string): Promise<{
    profilesIngested: number;
    connectionsFound: number;
    relationshipsCreated: number;
    errors: string[];
  }> {
    const result = {
      profilesIngested: 0,
      connectionsFound: 0,
      relationshipsCreated: 0,
      errors: [] as string[]
    };

    try {
      // Note: Company employee search requires LinkedIn Sales Navigator API
      // This is a placeholder for when those permissions are available
      result.errors.push('Company employee sync requires LinkedIn Sales Navigator API access');
    } catch (error) {
      result.errors.push(`Company sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async enrichExistingProfiles(): Promise<{
    profilesEnriched: number;
    errors: string[];
  }> {
    const result = {
      profilesEnriched: 0,
      errors: [] as string[]
    };

    try {
      // Get profiles that have LinkedIn IDs but limited data
      const profilesToEnrich = await db.select().from(persons)
        .where(eq(persons.linkedinId, ''))
        .limit(10);

      for (const person of profilesToEnrich) {
        try {
          // Search for LinkedIn profile by name and company
          const searchResults = await this.searchLinkedInProfiles(person.name, person.company || '');
          
          if (searchResults.length > 0) {
            const match = searchResults[0];
            await db.update(persons)
              .set({
                linkedinId: match.id,
                linkedinUrl: `https://www.linkedin.com/in/${match.id}`,
                updatedAt: new Date()
              })
              .where(eq(persons.id, person.id));
            
            result.profilesEnriched++;
          }
        } catch (error) {
          result.errors.push(`Failed to enrich profile ${person.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Profile enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async searchLinkedInProfiles(name: string, company: string): Promise<any[]> {
    try {
      // Note: LinkedIn profile search requires special API access
      // This would use the People Search API when available
      return [];
    } catch (error) {
      console.error('LinkedIn search error:', error);
      return [];
    }
  }

  private getLocalizedValue(localized: { [key: string]: string } | undefined): string {
    if (!localized) return '';
    
    // Try common locale keys
    const keys = ['en_US', 'en', Object.keys(localized)[0]];
    for (const key of keys) {
      if (localized[key]) return localized[key];
    }
    
    return '';
  }

  private extractCompanyFromHeadline(headline: string): string {
    // Extract company name from headline like "Software Engineer at Google"
    const patterns = [
      /at\s+([^|,]+)/i,
      /@\s+([^|,]+)/i,
      /\|\s*([^|,]+)/i
    ];

    for (const pattern of patterns) {
      const match = headline.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }
}

export function createLinkedInDataIngestion(accessToken: string): LinkedInDataIngestion {
  return new LinkedInDataIngestion(accessToken);
}