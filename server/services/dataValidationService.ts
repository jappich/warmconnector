// Data validation and deduplication service for external API data
// Ensures data quality and prevents duplicate entries

import { db } from '../db';
import { persons, externalDataSources, relationshipMetadata } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: any;
}

interface DeduplicationResult {
  isDuplicate: boolean;
  existingId?: string;
  confidence: number;
  matchedFields: string[];
}

export class DataValidationService {

  // Validate person data from external APIs
  validatePersonData(data: any, source: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalizedData: any = {};

    // Required fields validation
    if (!data.name && !data.firstName && !data.lastName) {
      errors.push('Person must have a name or firstName/lastName');
    } else {
      // Normalize name
      if (data.name) {
        normalizedData.name = this.normalizeName(data.name);
      } else {
        normalizedData.name = this.normalizeName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
      }
    }

    // Email validation
    if (data.email) {
      if (!this.isValidEmail(data.email)) {
        errors.push(`Invalid email format: ${data.email}`);
      } else {
        normalizedData.email = data.email.toLowerCase().trim();
      }
    }

    // Company validation
    if (data.company) {
      normalizedData.company = this.normalizeCompanyName(data.company);
    } else {
      warnings.push('No company information provided');
    }

    // Title validation
    if (data.title) {
      normalizedData.title = this.normalizeTitle(data.title);
    }

    // Location validation
    if (data.location) {
      normalizedData.location = this.normalizeLocation(data.location);
    }

    // LinkedIn URL validation
    if (data.linkedinUrl || data.linkedin_url) {
      const linkedinUrl = data.linkedinUrl || data.linkedin_url;
      if (this.isValidLinkedInUrl(linkedinUrl)) {
        normalizedData.linkedinProfile = linkedinUrl;
      } else {
        warnings.push(`Invalid LinkedIn URL format: ${linkedinUrl}`);
      }
    }

    // Source-specific validations
    switch (source) {
      case 'pdl':
        if (!data.id) {
          errors.push('PDL data must include an ID');
        }
        break;
      case 'clearbit':
        if (data.person && !data.company) {
          warnings.push('Clearbit person data without company context');
        }
        break;
      case 'zoominfo':
        if (!data.email && !data.phone) {
          warnings.push('ZoomInfo contact without email or phone');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      normalizedData: errors.length === 0 ? normalizedData : undefined
    };
  }

  // Check for duplicate persons in the database
  async checkForDuplicates(personData: any): Promise<DeduplicationResult> {
    const matchedFields: string[] = [];
    let bestMatch: any = null;
    let highestConfidence = 0;

    // Check for exact email match
    if (personData.email) {
      const emailMatches = await db.select()
        .from(persons)
        .where(eq(persons.email, personData.email))
        .limit(1);

      if (emailMatches.length > 0) {
        return {
          isDuplicate: true,
          existingId: emailMatches[0].id,
          confidence: 95,
          matchedFields: ['email']
        };
      }
    }

    // Check for name + company combination
    if (personData.name && personData.company) {
      const nameCompanyMatches = await db.execute(sql`
        SELECT id, name, company, 
               similarity(name, ${personData.name}) as name_sim,
               similarity(company, ${personData.company}) as company_sim
        FROM persons 
        WHERE similarity(name, ${personData.name}) > 0.8 
        AND similarity(company, ${personData.company}) > 0.8
        ORDER BY (similarity(name, ${personData.name}) + similarity(company, ${personData.company})) DESC
        LIMIT 1
      `);

      if (nameCompanyMatches.length > 0) {
        const match = nameCompanyMatches[0];
        const confidence = Math.round(((match.name_sim as number) + (match.company_sim as number)) * 50);
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = match;
          matchedFields.push('name', 'company');
        }
      }
    }

    // Check LinkedIn profile match
    if (personData.linkedinProfile) {
      const linkedinMatches = await db.select()
        .from(persons)
        .where(eq(persons.linkedinProfile, personData.linkedinProfile))
        .limit(1);

      if (linkedinMatches.length > 0) {
        return {
          isDuplicate: true,
          existingId: linkedinMatches[0].id,
          confidence: 90,
          matchedFields: ['linkedinProfile']
        };
      }
    }

    // Return best fuzzy match if confidence is high enough
    if (bestMatch && highestConfidence > 80) {
      return {
        isDuplicate: true,
        existingId: bestMatch.id,
        confidence: highestConfidence,
        matchedFields
      };
    }

    return {
      isDuplicate: false,
      confidence: 0,
      matchedFields: []
    };
  }

  // Generate data hash for external source tracking
  generateDataHash(data: any): string {
    const normalizedData = {
      name: data.name,
      email: data.email,
      company: data.company,
      title: data.title
    };
    
    const dataString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Store external data source tracking
  async trackExternalData(
    personId: string, 
    source: string, 
    externalId: string, 
    rawData: any,
    confidence: number = 100
  ): Promise<void> {
    const dataHash = this.generateDataHash(rawData);
    
    try {
      await db.insert(externalDataSources).values({
        id: `ext_${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        personId,
        source,
        externalId,
        confidence,
        lastUpdated: new Date(),
        rawData: JSON.stringify(rawData),
        dataHash
      });
    } catch (error) {
      // Entry might already exist
      console.log(`External data tracking entry already exists for ${personId} from ${source}`);
    }
  }

  // Validate relationship data
  validateRelationshipData(
    fromPersonId: string, 
    toPersonId: string, 
    relationshipType: string,
    evidence?: any
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!fromPersonId || !toPersonId) {
      errors.push('Relationship must have valid from and to person IDs');
    }

    if (fromPersonId === toPersonId) {
      errors.push('Person cannot have relationship with themselves');
    }

    // Relationship type validation
    const validTypes = ['coworker', 'family', 'school', 'professional', 'assistant', 'board', 'investment'];
    if (!validTypes.includes(relationshipType)) {
      errors.push(`Invalid relationship type: ${relationshipType}`);
    }

    // Evidence validation
    if (evidence) {
      switch (relationshipType) {
        case 'coworker':
          if (!evidence.company) {
            warnings.push('Coworker relationship without company evidence');
          }
          break;
        case 'school':
          if (!evidence.institution) {
            warnings.push('School relationship without institution evidence');
          }
          break;
        case 'family':
          if (!evidence.relationType) {
            warnings.push('Family relationship without relation type');
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Confidence scoring for relationships based on evidence
  calculateRelationshipConfidence(relationshipType: string, evidence: any): number {
    let baseConfidence = 50;

    switch (relationshipType) {
      case 'coworker':
        baseConfidence = 70;
        if (evidence.startDate && evidence.endDate) {
          baseConfidence += 10; // Date overlap evidence
        }
        if (evidence.sameTeam) {
          baseConfidence += 15; // Same team/department
        }
        break;

      case 'school':
        baseConfidence = 75;
        if (evidence.graduationYear) {
          baseConfidence += 10; // Same graduation year
        }
        if (evidence.degree) {
          baseConfidence += 5; // Same degree program
        }
        break;

      case 'family':
        baseConfidence = 95; // High confidence for family
        break;

      case 'assistant':
        baseConfidence = 85; // High confidence for EA relationships
        break;

      case 'board':
        baseConfidence = 80; // Board members are typically public
        break;

      default:
        baseConfidence = 60;
    }

    return Math.min(baseConfidence, 100);
  }

  // Data normalization methods
  private normalizeName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeCompanyName(company: string): string {
    return company
      .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited)\b\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeTitle(title: string): string {
    return title
      .replace(/\b(Sr|Jr|Senior|Junior)\b\.?/gi, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeLocation(location: string): string {
    // Common location normalizations
    const replacements: Record<string, string> = {
      'SF': 'San Francisco',
      'NYC': 'New York',
      'LA': 'Los Angeles',
      'Bay Area': 'San Francisco'
    };

    let normalized = location;
    for (const [abbrev, full] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(`\\b${abbrev}\\b`, 'gi'), full);
    }

    return normalized.trim();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidLinkedInUrl(url: string): boolean {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  }

  // Bulk validation for large datasets
  async validateBulkData(
    dataArray: any[], 
    source: string
  ): Promise<{
    valid: any[];
    invalid: Array<{ data: any; errors: string[] }>;
    duplicates: Array<{ data: any; existingId: string }>;
    stats: { total: number; valid: number; invalid: number; duplicates: number };
  }> {
    const results = {
      valid: [] as any[],
      invalid: [] as Array<{ data: any; errors: string[] }>,
      duplicates: [] as Array<{ data: any; existingId: string }>,
      stats: { total: dataArray.length, valid: 0, invalid: 0, duplicates: 0 }
    };

    for (const data of dataArray) {
      // Validate data format
      const validation = this.validatePersonData(data, source);
      
      if (!validation.isValid) {
        results.invalid.push({ data, errors: validation.errors });
        results.stats.invalid++;
        continue;
      }

      // Check for duplicates
      const duplication = await this.checkForDuplicates(validation.normalizedData);
      
      if (duplication.isDuplicate && duplication.confidence > 80) {
        results.duplicates.push({ 
          data: validation.normalizedData, 
          existingId: duplication.existingId! 
        });
        results.stats.duplicates++;
        continue;
      }

      results.valid.push(validation.normalizedData);
      results.stats.valid++;
    }

    return results;
  }
}

export const dataValidationService = new DataValidationService();