// Enhanced relationship intelligence with specific detectors
// Implements GPT's suggested detection algorithms

import { db } from '../db';
import { persons, relationshipEdges, users } from '@shared/schema';
import { eq, and, like, sql, desc } from 'drizzle-orm';

interface DetectionResult {
  fromId: string;
  toId: string;
  type: string;
  confidenceScore: number;
  evidence: any;
  source: string;
}

export class RelationshipIntelligenceService {

  // Alumni Detector: if (a.school === b.school && a.grad_year <= b.grad_year+5) addEdge('ALUMNI', 0.8)
  async detectAlumniConnections(): Promise<DetectionResult[]> {
    console.log('🎓 Running alumni detection...');
    
    const results: DetectionResult[] = [];
    
    // Get all people with education data
    const peopleWithEducation = await db.select()
      .from(persons)
      .where(sql`${persons.education} IS NOT NULL AND ${persons.education} != ''`);

    // Parse education and find matches
    for (let i = 0; i < peopleWithEducation.length; i++) {
      for (let j = i + 1; j < peopleWithEducation.length; j++) {
        const personA = peopleWithEducation[i];
        const personB = peopleWithEducation[j];
        
        const schoolA = this.extractSchool(personA.education || '');
        const schoolB = this.extractSchool(personB.education || '');
        const yearA = this.extractGradYear(personA.education || '');
        const yearB = this.extractGradYear(personB.education || '');
        
        if (schoolA && schoolB && schoolA.toLowerCase() === schoolB.toLowerCase()) {
          let confidence = 80; // Base alumni confidence
          
          // Same graduation year or within 5 years
          if (yearA && yearB && Math.abs(yearA - yearB) <= 5) {
            confidence = 85;
          }
          
          results.push({
            fromId: personA.id,
            toId: personB.id,
            type: 'ALUMNI',
            confidenceScore: confidence,
            evidence: {
              school: schoolA,
              yearA,
              yearB,
              educationA: personA.education,
              educationB: personB.education
            },
            source: 'alumni_detector'
          });
        }
      }
    }
    
    console.log(`✅ Found ${results.length} alumni connections`);
    return results;
  }

  // EA Identifier: title contains ('executive assistant' OR 'EA to') → edge ASSISTANT_TO
  async identifyExecutiveAssistants(): Promise<DetectionResult[]> {
    console.log('👥 Identifying executive assistants...');
    
    const results: DetectionResult[] = [];
    
    // Find all executive assistants
    const assistants = await db.select()
      .from(persons)
      .where(
        sql`LOWER(${persons.title}) LIKE '%executive assistant%' OR 
            LOWER(${persons.title}) LIKE '%ea to%' OR
            LOWER(${persons.title}) LIKE '%assistant to%' OR
            LOWER(${persons.title}) LIKE '%chief of staff%'`
      );

    for (const assistant of assistants) {
      // Find executives in same company
      const executives = await db.select()
        .from(persons)
        .where(
          and(
            eq(persons.company, assistant.company || ''),
            sql`(LOWER(${persons.title}) LIKE '%ceo%' OR 
                 LOWER(${persons.title}) LIKE '%president%' OR 
                 LOWER(${persons.title}) LIKE '%chief%' OR 
                 LOWER(${persons.title}) LIKE '%founder%' OR
                 LOWER(${persons.title}) LIKE '%vp%' OR
                 LOWER(${persons.title}) LIKE '%director%')`
          )
        );

      for (const exec of executives) {
        results.push({
          fromId: assistant.id,
          toId: exec.id,
          type: 'ASSISTANT_TO',
          confidenceScore: 90,
          evidence: {
            assistantTitle: assistant.title,
            executiveTitle: exec.title,
            company: assistant.company,
            assistantName: assistant.name,
            executiveName: exec.name
          },
          source: 'ea_identifier'
        });
      }
    }
    
    console.log(`✅ Found ${results.length} executive assistant relationships`);
    return results;
  }

  // Board Member Mapper: Parse "Board Member" / "Advisor" in titles → BOARD_MEMBER edges
  async mapBoardMembers(): Promise<DetectionResult[]> {
    console.log('🏢 Mapping board member relationships...');
    
    const results: DetectionResult[] = [];
    
    // Find board members and advisors
    const boardMembers = await db.select()
      .from(persons)
      .where(
        sql`LOWER(${persons.title}) LIKE '%board%' OR 
            LOWER(${persons.title}) LIKE '%advisor%' OR 
            LOWER(${persons.title}) LIKE '%trustee%' OR
            LOWER(${persons.title}) LIKE '%director%'`
      );

    // Group by company to find board relationships
    const companyBoards = new Map<string, typeof boardMembers>();
    
    for (const member of boardMembers) {
      if (!member.company) continue;
      
      if (!companyBoards.has(member.company)) {
        companyBoards.set(member.company, []);
      }
      companyBoards.get(member.company)!.push(member);
    }

    // Create board member relationships
    for (const [company, members] of companyBoards) {
      if (members.length > 1) {
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            results.push({
              fromId: members[i].id,
              toId: members[j].id,
              type: 'BOARD_MEMBER',
              confidenceScore: 85,
              evidence: {
                company,
                titleA: members[i].title,
                titleB: members[j].title,
                nameA: members[i].name,
                nameB: members[j].name
              },
              source: 'board_mapper'
            });
          }
        }
      }
    }
    
    console.log(`✅ Found ${results.length} board member relationships`);
    return results;
  }

  // Job-Overlap Score: overlapMonths / totalMonths → confidence
  async calculateJobOverlaps(): Promise<DetectionResult[]> {
    console.log('💼 Calculating job overlaps...');
    
    const results: DetectionResult[] = [];
    
    // Get people with job history metadata
    const peopleWithHistory = await db.select()
      .from(persons)
      .where(sql`${persons.metadata} IS NOT NULL`);

    const companyEmployees = new Map<string, Array<{
      person: typeof peopleWithHistory[0];
      startDate?: Date;
      endDate?: Date;
    }>>();

    // Parse job history
    for (const person of peopleWithHistory) {
      try {
        const metadata = JSON.parse(person.metadata || '{}');
        const startDate = metadata.startDate ? new Date(metadata.startDate) : undefined;
        const endDate = metadata.endDate ? new Date(metadata.endDate) : undefined;

        if (!companyEmployees.has(person.company || '')) {
          companyEmployees.set(person.company || '', []);
        }

        companyEmployees.get(person.company || '')!.push({
          person,
          startDate,
          endDate
        });
      } catch (error) {
        continue;
      }
    }

    // Calculate overlaps
    for (const [company, employees] of companyEmployees) {
      for (let i = 0; i < employees.length; i++) {
        for (let j = i + 1; j < employees.length; j++) {
          const emp1 = employees[i];
          const emp2 = employees[j];

          const overlap = this.calculateTimeOverlap(
            emp1.startDate, emp1.endDate,
            emp2.startDate, emp2.endDate
          );

          if (overlap.overlapMonths > 0) {
            // overlapMonths / totalMonths → confidence
            const totalMonths = Math.max(
              this.getMonthsBetween(emp1.startDate, emp1.endDate || new Date()),
              this.getMonthsBetween(emp2.startDate, emp2.endDate || new Date())
            );
            
            const confidence = Math.min(60 + (overlap.overlapMonths / totalMonths) * 30, 95);

            results.push({
              fromId: emp1.person.id,
              toId: emp2.person.id,
              type: 'COWORKER',
              confidenceScore: Math.round(confidence),
              evidence: {
                company,
                overlapMonths: overlap.overlapMonths,
                totalMonthsA: this.getMonthsBetween(emp1.startDate, emp1.endDate || new Date()),
                totalMonthsB: this.getMonthsBetween(emp2.startDate, emp2.endDate || new Date()),
                overlapPeriod: overlap.period
              },
              source: 'job_overlap_calculator'
            });
          }
        }
      }
    }
    
    console.log(`✅ Found ${results.length} job overlap relationships`);
    return results;
  }

  // Geographic Edge: Same hometown_city → HOMETOWN, confidence 0.7
  async detectGeographicConnections(): Promise<DetectionResult[]> {
    console.log('🌍 Detecting geographic connections...');
    
    const results: DetectionResult[] = [];
    
    // Group people by hometown
    const hometownGroups = new Map<string, typeof persons.$inferSelect[]>();

    const peopleWithHometowns = await db.select()
      .from(persons)
      .where(sql`${persons.hometown} IS NOT NULL AND ${persons.hometown} != ''`);

    for (const person of peopleWithHometowns) {
      const hometown = this.normalizeLocation(person.hometown || '');
      
      if (!hometownGroups.has(hometown)) {
        hometownGroups.set(hometown, []);
      }
      hometownGroups.get(hometown)!.push(person);
    }

    // Create hometown connections
    for (const [hometown, people] of hometownGroups) {
      if (people.length > 1) {
        for (let i = 0; i < people.length; i++) {
          for (let j = i + 1; j < people.length; j++) {
            results.push({
              fromId: people[i].id,
              toId: people[j].id,
              type: 'HOMETOWN',
              confidenceScore: 70,
              evidence: {
                sharedHometown: hometown,
                hometownA: people[i].hometown,
                hometownB: people[j].hometown,
                nameA: people[i].name,
                nameB: people[j].name
              },
              source: 'geographic_detector'
            });
          }
        }
      }
    }
    
    console.log(`✅ Found ${results.length} geographic connections`);
    return results;
  }

  // Save detected relationships to database
  async saveRelationships(relationships: DetectionResult[]): Promise<number> {
    let savedCount = 0;
    
    for (const rel of relationships) {
      try {
        await db.insert(relationshipEdges).values({
          fromId: rel.fromId,
          toId: rel.toId,
          type: rel.type,
          confidenceScore: rel.confidenceScore,
          source: rel.source,
          evidence: JSON.stringify(rel.evidence),
          isGhost: false,
          createdAt: new Date()
        });
        savedCount++;
      } catch (error) {
        // Relationship might already exist (unique constraint)
        continue;
      }
    }
    
    return savedCount;
  }

  // Run all detectors
  async runAllDetectors(): Promise<{
    alumni: number;
    assistants: number;
    boardMembers: number;
    jobOverlaps: number;
    geographic: number;
    totalSaved: number;
  }> {
    console.log('🔍 Running comprehensive relationship intelligence analysis...');
    
    const [alumni, assistants, boardMembers, jobOverlaps, geographic] = await Promise.all([
      this.detectAlumniConnections(),
      this.identifyExecutiveAssistants(),
      this.mapBoardMembers(),
      this.calculateJobOverlaps(),
      this.detectGeographicConnections()
    ]);

    // Save all relationships
    const allRelationships = [...alumni, ...assistants, ...boardMembers, ...jobOverlaps, ...geographic];
    const totalSaved = await this.saveRelationships(allRelationships);

    const stats = {
      alumni: alumni.length,
      assistants: assistants.length,
      boardMembers: boardMembers.length,
      jobOverlaps: jobOverlaps.length,
      geographic: geographic.length,
      totalSaved
    };

    console.log('📊 Intelligence Analysis Complete:', stats);
    return stats;
  }

  // Utility methods
  private extractSchool(education: string): string | null {
    // Extract university/college name from education string
    const patterns = [
      /university of ([^,]+)/i,
      /([^,]+) university/i,
      /([^,]+) college/i,
      /(harvard|stanford|mit|yale|princeton|columbia|cornell|brown|dartmouth|upenn)/i
    ];
    
    for (const pattern of patterns) {
      const match = education.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return null;
  }

  private extractGradYear(education: string): number | null {
    const yearMatch = education.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  private calculateTimeOverlap(
    start1?: Date, end1?: Date,
    start2?: Date, end2?: Date
  ): { overlapMonths: number; period: string } {
    if (!start1 || !start2) return { overlapMonths: 0, period: 'unknown' };

    const actualEnd1 = end1 || new Date();
    const actualEnd2 = end2 || new Date();

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(actualEnd1.getTime(), actualEnd2.getTime()));

    if (overlapStart >= overlapEnd) {
      return { overlapMonths: 0, period: 'no overlap' };
    }

    const overlapMonths = this.getMonthsBetween(overlapStart, overlapEnd);

    return {
      overlapMonths,
      period: `${overlapStart.toISOString().slice(0, 7)} to ${overlapEnd.toISOString().slice(0, 7)}`
    };
  }

  private getMonthsBetween(start?: Date, end?: Date): number {
    if (!start || !end) return 0;
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  private normalizeLocation(location: string): string {
    const normalized = location.toLowerCase().trim();
    
    const replacements: Record<string, string> = {
      'sf': 'san francisco',
      'bay area': 'san francisco',
      'silicon valley': 'san francisco',
      'nyc': 'new york',
      'ny': 'new york',
      'la': 'los angeles'
    };

    for (const [abbrev, full] of Object.entries(replacements)) {
      if (normalized.includes(abbrev)) {
        return full;
      }
    }

    const cityMatch = normalized.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : normalized;
  }
}

export const relationshipIntelligenceService = new RelationshipIntelligenceService();