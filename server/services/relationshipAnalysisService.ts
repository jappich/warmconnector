// Advanced relationship analysis service for discovering high-impact professional connections
// Analyzes existing data to identify executive assistants, procurement contacts, and board networks

import { db } from '../db';
import { persons, relationships } from '@shared/schema';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { RELATIONSHIP_TYPES, DEFAULT_STRENGTHS } from '@shared/relationshipTypes';

interface ExecutiveAssistantCandidate {
  assistantId: string;
  assistantName: string;
  assistantTitle: string;
  executiveId: string;
  executiveName: string;
  executiveTitle: string;
  company: string;
  confidence: number;
  accessLevel: 'direct' | 'screened' | 'gatekeeper';
}

interface ProcurementContact {
  contactId: string;
  name: string;
  title: string;
  company: string;
  department: string;
  seniorityLevel: 'director' | 'manager' | 'coordinator' | 'analyst';
  decisionAuthority: number; // 1-100
}

interface BoardMemberCandidate {
  personId: string;
  name: string;
  currentCompany: string;
  title: string;
  boardIndicators: string[];
  confidence: number;
}

export class RelationshipAnalysisService {

  // Analyze existing data to identify executive assistant relationships
  async identifyExecutiveAssistants(): Promise<ExecutiveAssistantCandidate[]> {
    const assistantCandidates: ExecutiveAssistantCandidate[] = [];
    
    // Find people with assistant titles
    const assistantTitles = [
      'Executive Assistant',
      'Administrative Assistant',
      'Chief of Staff',
      'Personal Assistant',
      'Assistant to',
      'EA to',
      'Executive Admin',
      'Senior Assistant'
    ];
    
    for (const titlePattern of assistantTitles) {
      const assistants = await db.select()
        .from(persons)
        .where(like(persons.title, `%${titlePattern}%`));
      
      for (const assistant of assistants) {
        // Try to identify which executive they support
        const executive = await this.findSupportedExecutive(assistant);
        
        if (executive) {
          assistantCandidates.push({
            assistantId: assistant.id,
            assistantName: assistant.name,
            assistantTitle: assistant.title || '',
            executiveId: executive.id,
            executiveName: executive.name,
            executiveTitle: executive.title || '',
            company: assistant.company || '',
            confidence: this.calculateAssistantConfidence(assistant, executive),
            accessLevel: this.determineAccessLevel(assistant.title || '')
          });
        }
      }
    }
    
    return assistantCandidates;
  }

  // Find procurement-related contacts in existing data
  async identifyProcurementContacts(): Promise<ProcurementContact[]> {
    const procurementTitles = [
      'Procurement',
      'Sourcing',
      'Supply Chain',
      'Vendor Management',
      'Strategic Sourcing',
      'Category Manager',
      'Supplier Relations',
      'Contract Management',
      'Purchasing'
    ];
    
    const procurementContacts: ProcurementContact[] = [];
    
    for (const titlePattern of procurementTitles) {
      const contacts = await db.select()
        .from(persons)
        .where(like(persons.title, `%${titlePattern}%`));
      
      for (const contact of contacts) {
        procurementContacts.push({
          contactId: contact.id,
          name: contact.name,
          title: contact.title || '',
          company: contact.company || '',
          department: this.extractDepartment(contact.title || ''),
          seniorityLevel: this.determineSeniorityLevel(contact.title || ''),
          decisionAuthority: this.calculateDecisionAuthority(contact.title || '')
        });
      }
    }
    
    return procurementContacts.sort((a, b) => b.decisionAuthority - a.decisionAuthority);
  }

  // Identify potential board members from existing data
  async identifyBoardMembers(): Promise<BoardMemberCandidate[]> {
    const boardIndicators = [
      'Board',
      'Director',
      'Chairman',
      'Board Member',
      'Independent Director',
      'Non-Executive Director',
      'Advisory Board',
      'Board of Directors',
      'Trustee'
    ];
    
    const boardCandidates: BoardMemberCandidate[] = [];
    
    // Look for board-related titles
    for (const indicator of boardIndicators) {
      const candidates = await db.select()
        .from(persons)
        .where(like(persons.title, `%${indicator}%`));
      
      for (const candidate of candidates) {
        const indicators = this.extractBoardIndicators(candidate.title || '');
        
        if (indicators.length > 0) {
          boardCandidates.push({
            personId: candidate.id,
            name: candidate.name,
            currentCompany: candidate.company || '',
            title: candidate.title || '',
            boardIndicators: indicators,
            confidence: this.calculateBoardConfidence(indicators, candidate.title || '')
          });
        }
      }
    }
    
    return boardCandidates.sort((a, b) => b.confidence - a.confidence);
  }

  // Analyze job title patterns to identify high-value relationship types
  async analyzeJobTitlePatterns(): Promise<any> {
    const titleAnalysis = await db.execute(sql`
      SELECT 
        title,
        COUNT(*) as count,
        company,
        array_agg(DISTINCT name) as people
      FROM persons 
      WHERE title IS NOT NULL 
      GROUP BY title, company
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 100
    `);
    
    const patterns = {
      executiveAssistants: [],
      procurement: [],
      customerSuccess: [],
      boardMembers: [],
      analysts: [],
      other: []
    };
    
    for (const row of titleAnalysis.rows) {
      const title = row.title as string;
      const company = row.company as string;
      const count = row.count as number;
      
      if (this.isExecutiveAssistantTitle(title)) {
        patterns.executiveAssistants.push({ title, company, count });
      } else if (this.isProcurementTitle(title)) {
        patterns.procurement.push({ title, company, count });
      } else if (this.isCustomerSuccessTitle(title)) {
        patterns.customerSuccess.push({ title, company, count });
      } else if (this.isBoardTitle(title)) {
        patterns.boardMembers.push({ title, company, count });
      } else if (this.isAnalystTitle(title)) {
        patterns.analysts.push({ title, company, count });
      } else {
        patterns.other.push({ title, company, count });
      }
    }
    
    return patterns;
  }

  // Create new relationships for identified high-value connections
  async createAdvancedRelationships(): Promise<number> {
    let createdCount = 0;
    
    // Create executive assistant relationships
    const assistants = await this.identifyExecutiveAssistants();
    for (const assistant of assistants) {
      if (assistant.confidence > 70) {
        await this.createRelationship(
          assistant.executiveId,
          assistant.assistantId,
          RELATIONSHIP_TYPES.EXECUTIVE_ASSISTANT,
          DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.EXECUTIVE_ASSISTANT],
          {
            accessLevel: assistant.accessLevel,
            assistantTitle: assistant.assistantTitle,
            confidence: assistant.confidence,
            discoveryMethod: 'title_analysis'
          }
        );
        createdCount++;
      }
    }
    
    // Create procurement vendor relationships (inferred from company relationships)
    const procurementContacts = await this.identifyProcurementContacts();
    for (const contact of procurementContacts) {
      if (contact.decisionAuthority > 60) {
        // Find potential vendor relationships through existing coworker connections
        const vendorConnections = await this.findPotentialVendorRelationships(contact.contactId);
        
        for (const vendor of vendorConnections) {
          await this.createRelationship(
            contact.contactId,
            vendor.personId,
            RELATIONSHIP_TYPES.PROCUREMENT_VENDOR,
            this.calculateProcurementStrength(contact.decisionAuthority),
            {
              procurementRole: contact.title,
              seniorityLevel: contact.seniorityLevel,
              decisionAuthority: contact.decisionAuthority,
              discoveryMethod: 'procurement_analysis'
            }
          );
          createdCount++;
        }
      }
    }
    
    // Create board member networks
    const boardMembers = await this.identifyBoardMembers();
    const boardNetworks = await this.findBoardNetworks(boardMembers);
    
    for (const network of boardNetworks) {
      for (const connection of network.connections) {
        await this.createRelationship(
          network.personId,
          connection.personId,
          RELATIONSHIP_TYPES.BOARD_MEMBER,
          DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.BOARD_MEMBER],
          {
            boardIndicators: network.boardIndicators,
            sharedBoards: connection.sharedBoards,
            confidence: connection.confidence,
            discoveryMethod: 'board_analysis'
          }
        );
        createdCount++;
      }
    }
    
    return createdCount;
  }

  // Helper methods
  private async findSupportedExecutive(assistant: any): Promise<any> {
    const assistantTitle = assistant.title?.toLowerCase() || '';
    
    // Look for "Assistant to [Name]" pattern
    const toMatch = assistantTitle.match(/assistant to (.+)/);
    if (toMatch) {
      const executiveName = toMatch[1].trim();
      const executive = await db.select()
        .from(persons)
        .where(and(
          like(persons.name, `%${executiveName}%`),
          eq(persons.company, assistant.company)
        ))
        .limit(1);
      
      if (executive.length > 0) return executive[0];
    }
    
    // Look for executives in same company with C-level or VP titles
    const executives = await db.select()
      .from(persons)
      .where(and(
        eq(persons.company, assistant.company),
        or(
          like(persons.title, '%CEO%'),
          like(persons.title, '%CTO%'),
          like(persons.title, '%CFO%'),
          like(persons.title, '%CMO%'),
          like(persons.title, '%VP%'),
          like(persons.title, '%President%'),
          like(persons.title, '%Chief%')
        )
      ));
    
    // Return the highest-ranking executive
    return executives.length > 0 ? executives[0] : null;
  }

  private calculateAssistantConfidence(assistant: any, executive: any): number {
    let confidence = 50;
    
    const title = assistant.title?.toLowerCase() || '';
    
    // Higher confidence for specific assistant titles
    if (title.includes('executive assistant')) confidence += 30;
    if (title.includes('chief of staff')) confidence += 25;
    if (title.includes('assistant to')) confidence += 35;
    
    // Higher confidence if executive has C-level title
    const execTitle = executive.title?.toLowerCase() || '';
    if (execTitle.includes('ceo') || execTitle.includes('president')) confidence += 20;
    if (execTitle.includes('cto') || execTitle.includes('cfo')) confidence += 15;
    
    return Math.min(confidence, 100);
  }

  private determineAccessLevel(title: string): 'direct' | 'screened' | 'gatekeeper' {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('chief of staff')) return 'direct';
    if (lowerTitle.includes('executive assistant')) return 'direct';
    if (lowerTitle.includes('personal assistant')) return 'screened';
    
    return 'gatekeeper';
  }

  private determineSeniorityLevel(title: string): 'director' | 'manager' | 'coordinator' | 'analyst' {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('director') || lowerTitle.includes('vp')) return 'director';
    if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) return 'manager';
    if (lowerTitle.includes('coordinator') || lowerTitle.includes('specialist')) return 'coordinator';
    
    return 'analyst';
  }

  private calculateDecisionAuthority(title: string): number {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('director') || lowerTitle.includes('vp')) return 90;
    if (lowerTitle.includes('senior manager')) return 75;
    if (lowerTitle.includes('manager')) return 60;
    if (lowerTitle.includes('senior')) return 50;
    if (lowerTitle.includes('lead')) return 45;
    
    return 30;
  }

  private extractDepartment(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('strategic')) return 'Strategic Sourcing';
    if (lowerTitle.includes('category')) return 'Category Management';
    if (lowerTitle.includes('supplier')) return 'Supplier Relations';
    if (lowerTitle.includes('contract')) return 'Contract Management';
    
    return 'General Procurement';
  }

  private extractBoardIndicators(title: string): string[] {
    const indicators = [];
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('board member')) indicators.push('Board Member');
    if (lowerTitle.includes('independent director')) indicators.push('Independent Director');
    if (lowerTitle.includes('chairman')) indicators.push('Chairman');
    if (lowerTitle.includes('advisory board')) indicators.push('Advisory Board');
    if (lowerTitle.includes('trustee')) indicators.push('Trustee');
    
    return indicators;
  }

  private calculateBoardConfidence(indicators: string[], title: string): number {
    let confidence = indicators.length * 20;
    
    if (title.toLowerCase().includes('independent')) confidence += 15;
    if (title.toLowerCase().includes('chairman')) confidence += 20;
    
    return Math.min(confidence, 100);
  }

  private calculateProcurementStrength(decisionAuthority: number): number {
    const baseStrength = DEFAULT_STRENGTHS[RELATIONSHIP_TYPES.PROCUREMENT_VENDOR];
    const bonus = Math.floor(decisionAuthority * 0.3);
    
    return Math.min(baseStrength + bonus, 100);
  }

  private async findPotentialVendorRelationships(procurementContactId: string): Promise<any[]> {
    // Find people at different companies who might be vendors
    const contact = await db.select()
      .from(persons)
      .where(eq(persons.id, procurementContactId))
      .limit(1);
    
    if (contact.length === 0) return [];
    
    const contactCompany = contact[0].company;
    
    // Find sales/business development people at other companies
    const potentialVendors = await db.select()
      .from(persons)
      .where(and(
        sql`company != ${contactCompany}`,
        or(
          like(persons.title, '%Sales%'),
          like(persons.title, '%Business Development%'),
          like(persons.title, '%Account%'),
          like(persons.title, '%Partnership%')
        )
      ))
      .limit(50);
    
    return potentialVendors.map(p => ({ personId: p.id }));
  }

  private async findBoardNetworks(boardMembers: BoardMemberCandidate[]): Promise<any[]> {
    // Group board members by company to find potential shared board service
    const networks = [];
    
    for (const member of boardMembers) {
      const connections = [];
      
      // Find other board members at different companies
      for (const otherMember of boardMembers) {
        if (member.personId !== otherMember.personId && 
            member.currentCompany !== otherMember.currentCompany) {
          
          connections.push({
            personId: otherMember.personId,
            sharedBoards: this.findSharedBoardIndicators(member.boardIndicators, otherMember.boardIndicators),
            confidence: Math.min(member.confidence, otherMember.confidence)
          });
        }
      }
      
      if (connections.length > 0) {
        networks.push({
          personId: member.personId,
          boardIndicators: member.boardIndicators,
          connections: connections.slice(0, 10) // Limit connections per person
        });
      }
    }
    
    return networks;
  }

  private findSharedBoardIndicators(indicators1: string[], indicators2: string[]): string[] {
    return indicators1.filter(indicator => indicators2.includes(indicator));
  }

  private async createRelationship(fromId: string, toId: string, type: string, strength: number, metadata: any): Promise<void> {
    try {
      await db.insert(relationships).values({
        fromId,
        toId,
        type,
        confidenceScore: strength,
        evidence: JSON.stringify(metadata)
      });
    } catch (error) {
      // Relationship might already exist, which is fine
      console.log(`Relationship ${fromId} -> ${toId} (${type}) might already exist`);
    }
  }

  // Title classification helper methods
  private isExecutiveAssistantTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return ['assistant', 'chief of staff', 'ea to', 'admin'].some(keyword => lowerTitle.includes(keyword));
  }

  private isProcurementTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return ['procurement', 'sourcing', 'supply chain', 'vendor', 'purchasing'].some(keyword => lowerTitle.includes(keyword));
  }

  private isCustomerSuccessTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return ['customer success', 'account manager', 'client success', 'customer experience'].some(keyword => lowerTitle.includes(keyword));
  }

  private isBoardTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return ['board', 'director', 'chairman', 'trustee'].some(keyword => lowerTitle.includes(keyword));
  }

  private isAnalystTitle(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return ['analyst', 'research', 'advisory'].some(keyword => lowerTitle.includes(keyword));
  }
}

export const relationshipAnalysisService = new RelationshipAnalysisService();