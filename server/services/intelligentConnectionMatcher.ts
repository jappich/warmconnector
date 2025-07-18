import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, or, like, ilike } from 'drizzle-orm';

interface MatchResult {
  found: boolean;
  matches: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType: string;
    strength: number;
    confidence: number;
    strengthFactors: string[];
    introductionStrategy: string;
  }>;
  strategy: string;
}

export class IntelligentConnectionMatcher {
  async findByMinimalInfo(targetName: string, targetCompany: string, targetTitle?: string): Promise<MatchResult> {
    try {
      // Search for exact and fuzzy matches
      const nameVariations = this.generateNameVariations(targetName);
      const companyVariations = this.generateCompanyVariations(targetCompany);
      
      // First try exact matches
      let matches = await this.findExactMatches(nameVariations, companyVariations, targetTitle);
      
      // If no exact matches, try fuzzy matching
      if (matches.length === 0) {
        matches = await this.findFuzzyMatches(targetName, targetCompany, targetTitle);
      }
      
      // Score and rank matches
      const rankedMatches = matches
        .map(match => this.enhanceMatchScoring(match, targetName, targetCompany))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      return {
        found: rankedMatches.length > 0,
        matches: rankedMatches,
        strategy: this.generateMatchStrategy(rankedMatches, targetName, targetCompany)
      };
      
    } catch (error) {
      console.error('Error in intelligent connection matching:', error);
      return {
        found: false,
        matches: [],
        strategy: `Unable to find connections to ${targetName}${targetCompany ? ` at ${targetCompany}` : ''}. Try expanding your search or adding more context.`
      };
    }
  }

  private generateNameVariations(name: string): string[] {
    const variations = [name];
    
    // Add common name variations
    const parts = name.split(' ');
    if (parts.length >= 2) {
      // First Last
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`);
      // Last, First
      variations.push(`${parts[parts.length - 1]}, ${parts[0]}`);
      // First initial + Last
      variations.push(`${parts[0][0]}. ${parts[parts.length - 1]}`);
      // First + Last initial
      variations.push(`${parts[0]} ${parts[parts.length - 1][0]}.`);
    }
    
    return [...new Set(variations)];
  }

  private generateCompanyVariations(company: string): string[] {
    if (!company) return [];
    
    const variations = [company];
    
    // Common company name variations
    const commonSuffixes = ['Inc', 'Inc.', 'LLC', 'Ltd', 'Corp', 'Corporation', 'Company', 'Co.'];
    
    // Remove suffixes
    let baseCompany = company;
    commonSuffixes.forEach(suffix => {
      if (company.endsWith(suffix)) {
        baseCompany = company.replace(new RegExp(`\\s*${suffix}$`, 'i'), '').trim();
        variations.push(baseCompany);
      }
    });
    
    // Add suffixes
    if (!commonSuffixes.some(suffix => company.endsWith(suffix))) {
      variations.push(`${company} Inc`);
      variations.push(`${company} LLC`);
    }
    
    return [...new Set(variations)];
  }

  private async findExactMatches(nameVariations: string[], companyVariations: string[], targetTitle?: string) {
    const matches = [];
    
    for (const name of nameVariations) {
      for (const company of companyVariations) {
        const query = db
          .select({
            person: persons,
            relationship: relationships
          })
          .from(persons)
          .leftJoin(relationships, eq(persons.id, relationships.personId2))
          .where(
            and(
              ilike(persons.name, `%${name}%`),
              company ? ilike(persons.company, `%${company}%`) : undefined
            )
          );

        const results = await query;
        
        results.forEach(result => {
          if (result.person) {
            matches.push({
              id: result.person.id,
              name: result.person.name,
              company: result.person.company,
              title: result.person.title,
              relationshipType: result.relationship?.relationshipType || 'UNKNOWN',
              strength: result.relationship?.strength || 50,
              confidence: this.calculateInitialConfidence(result.person, name, company),
              strengthFactors: this.identifyStrengthFactors(result.person, result.relationship),
              introductionStrategy: this.generateIntroductionStrategy(result.person, result.relationship)
            });
          }
        });
      }
    }
    
    return this.removeDuplicates(matches);
  }

  private async findFuzzyMatches(targetName: string, targetCompany: string, targetTitle?: string) {
    // Fuzzy matching using LIKE patterns
    const namePattern = `%${targetName.split(' ').join('%')}%`;
    const companyPattern = targetCompany ? `%${targetCompany.split(' ').join('%')}%` : null;
    
    const query = db
      .select({
        person: persons,
        relationship: relationships
      })
      .from(persons)
      .leftJoin(relationships, eq(persons.id, relationships.personId2))
      .where(
        or(
          ilike(persons.name, namePattern),
          companyPattern ? ilike(persons.company, companyPattern) : undefined,
          targetTitle ? ilike(persons.title, `%${targetTitle}%`) : undefined
        )
      );

    const results = await query;
    
    return results
      .filter(result => result.person)
      .map(result => ({
        id: result.person!.id,
        name: result.person!.name,
        company: result.person!.company,
        title: result.person!.title,
        relationshipType: result.relationship?.relationshipType || 'UNKNOWN',
        strength: result.relationship?.strength || 30,
        confidence: this.calculateFuzzyConfidence(result.person!, targetName, targetCompany),
        strengthFactors: this.identifyStrengthFactors(result.person!, result.relationship),
        introductionStrategy: this.generateIntroductionStrategy(result.person!, result.relationship)
      }));
  }

  private calculateInitialConfidence(person: any, targetName: string, targetCompany: string): number {
    let confidence = 60;
    
    // Name similarity
    if (person.name.toLowerCase().includes(targetName.toLowerCase())) {
      confidence += 30;
    }
    
    // Company match
    if (person.company && targetCompany && 
        person.company.toLowerCase().includes(targetCompany.toLowerCase())) {
      confidence += 20;
    }
    
    return Math.min(100, confidence);
  }

  private calculateFuzzyConfidence(person: any, targetName: string, targetCompany: string): number {
    let confidence = 40;
    
    // Basic fuzzy matching score
    const nameWords = targetName.toLowerCase().split(' ');
    const personNameWords = person.name.toLowerCase().split(' ');
    
    const nameOverlap = nameWords.filter(word => 
      personNameWords.some(pWord => pWord.includes(word) || word.includes(pWord))
    ).length;
    
    confidence += (nameOverlap / nameWords.length) * 30;
    
    if (person.company && targetCompany) {
      const companyWords = targetCompany.toLowerCase().split(' ');
      const personCompanyWords = person.company.toLowerCase().split(' ');
      
      const companyOverlap = companyWords.filter(word =>
        personCompanyWords.some(cWord => cWord.includes(word) || word.includes(cWord))
      ).length;
      
      confidence += (companyOverlap / companyWords.length) * 20;
    }
    
    return Math.min(95, confidence);
  }

  private enhanceMatchScoring(match: any, targetName: string, targetCompany: string): any {
    let enhancedConfidence = match.confidence;
    
    // Boost for strong relationships
    if (match.strength > 75) enhancedConfidence += 10;
    if (match.strength > 90) enhancedConfidence += 5;
    
    // Boost for certain relationship types
    if (['COWORKER', 'EDUCATION'].includes(match.relationshipType)) {
      enhancedConfidence += 15;
    }
    
    // Boost for complete profiles
    if (match.company && match.title) enhancedConfidence += 5;
    
    return {
      ...match,
      confidence: Math.min(100, enhancedConfidence)
    };
  }

  private identifyStrengthFactors(person: any, relationship: any): string[] {
    const factors = [];
    
    if (relationship?.strength > 80) factors.push('Strong relationship');
    if (relationship?.relationshipType === 'COWORKER') factors.push('Former colleague');
    if (relationship?.relationshipType === 'EDUCATION') factors.push('Alumni connection');
    if (person.company) factors.push('Company information available');
    if (person.title) factors.push('Role details known');
    
    return factors.length > 0 ? factors : ['Basic connection'];
  }

  private generateIntroductionStrategy(person: any, relationship: any): string {
    const strategies = [
      'Request warm introduction through mutual connection',
      'Send personalized LinkedIn message',
      'Attend industry events where they might be present',
      'Engage with their professional content online',
      'Ask for introduction during next conversation with mutual contact'
    ];
    
    if (relationship?.relationshipType === 'COWORKER') {
      return 'Leverage your work history together when requesting introduction';
    }
    
    if (relationship?.relationshipType === 'EDUCATION') {
      return 'Mention your shared educational background as common ground';
    }
    
    if (relationship?.strength > 80) {
      return 'Request direct introduction from your strong mutual connection';
    }
    
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private generateMatchStrategy(matches: any[], targetName: string, targetCompany: string): string {
    if (matches.length === 0) {
      return `No direct connections found to ${targetName}${targetCompany ? ` at ${targetCompany}` : ''}. Consider expanding your network in their industry or using LinkedIn to find mutual connections.`;
    }
    
    const bestMatch = matches[0];
    const totalMatches = matches.length;
    
    let strategy = `Found ${totalMatches} potential connection${totalMatches > 1 ? 's' : ''} to ${targetName}. `;
    
    if (bestMatch.confidence > 80) {
      strategy += `High confidence match: ${bestMatch.name}${bestMatch.company ? ` at ${bestMatch.company}` : ''}. `;
    } else if (bestMatch.confidence > 60) {
      strategy += `Good potential match: ${bestMatch.name}${bestMatch.company ? ` at ${bestMatch.company}` : ''}. `;
    } else {
      strategy += `Possible match: ${bestMatch.name}${bestMatch.company ? ` at ${bestMatch.company}` : ''}. `;
    }
    
    strategy += bestMatch.introductionStrategy;
    
    if (totalMatches > 1) {
      strategy += ` ${totalMatches - 1} additional connection${totalMatches > 2 ? 's' : ''} available as backup options.`;
    }
    
    return strategy;
  }

  private removeDuplicates(matches: any[]): any[] {
    const seen = new Set();
    return matches.filter(match => {
      const key = `${match.name}-${match.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const intelligentConnectionMatcher = new IntelligentConnectionMatcher();