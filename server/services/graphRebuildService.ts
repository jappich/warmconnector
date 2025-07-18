import { db } from '../db.js';
import { persons, relationships } from '../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

interface GraphStats {
  nodes: number;
  edges: number;
  relationshipBreakdown: {
    coworker: number;
    family: number;
    school: number;
    greek_life: number;
    professional: number;
    other: number;
  };
  companyBreakdown: Record<string, number>;
  lastRebuild: Date;
}

class GraphRebuildService {
  private isRebuilding: boolean = false;
  private lastRebuildTime: Date | null = null;
  private graphStats: GraphStats | null = null;

  /**
   * Rebuild the graph with comprehensive debug logging
   */
  async rebuildGraph(): Promise<GraphStats> {
    if (this.isRebuilding) {
      console.log('🔄 Graph rebuild already in progress, skipping...');
      return this.graphStats || this.getEmptyStats();
    }

    this.isRebuilding = true;
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting graph rebuild process...');
      
      // Get all persons and relationships
      const [allPersons, allRelationships] = await Promise.all([
        db.select().from(persons),
        db.select().from(relationships)
      ]);

      console.log(`📊 Data loaded:
        - ${allPersons.length} persons
        - ${allRelationships.length} relationships`);

      // Build comprehensive statistics
      const stats = await this.buildGraphStatistics(allPersons, allRelationships);
      
      // Log detailed breakdown
      this.logDetailedBreakdown(stats, allPersons, allRelationships);
      
      // Update internal state
      this.graphStats = stats;
      this.lastRebuildTime = new Date();
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Graph rebuild completed in ${processingTime}ms`);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Graph rebuild failed:', error);
      throw error;
    } finally {
      this.isRebuilding = false;
    }
  }

  /**
   * Build comprehensive graph statistics
   */
  private async buildGraphStatistics(persons: any[], relationships: any[]): Promise<GraphStats> {
    const relationshipBreakdown = {
      coworker: 0,
      family: 0,
      school: 0,
      greek_life: 0,
      professional: 0,
      other: 0
    };

    const companyBreakdown: Record<string, number> = {};

    // Count relationship types
    relationships.forEach(rel => {
      const type = rel.relationshipType || 'other';
      if (relationshipBreakdown.hasOwnProperty(type)) {
        relationshipBreakdown[type as keyof typeof relationshipBreakdown]++;
      } else {
        relationshipBreakdown.other++;
      }
    });

    // Count persons by company
    persons.forEach(person => {
      const company = person.company || 'Unknown';
      companyBreakdown[company] = (companyBreakdown[company] || 0) + 1;
    });

    return {
      nodes: persons.length,
      edges: relationships.length,
      relationshipBreakdown,
      companyBreakdown,
      lastRebuild: new Date()
    };
  }

  /**
   * Log detailed breakdown of graph data
   */
  private logDetailedBreakdown(stats: GraphStats, persons: any[], relationships: any[]) {
    console.log('\n📈 GRAPH STATISTICS:');
    console.log(`├── Nodes (Persons): ${stats.nodes}`);
    console.log(`└── Edges (Relationships): ${stats.edges}`);
    
    console.log('\n🔗 RELATIONSHIP BREAKDOWN:');
    Object.entries(stats.relationshipBreakdown).forEach(([type, count]) => {
      const percentage = stats.edges > 0 ? ((count / stats.edges) * 100).toFixed(1) : '0.0';
      console.log(`├── ${type.padEnd(12)}: ${count.toString().padStart(4)} (${percentage}%)`);
    });

    console.log('\n🏢 COMPANY BREAKDOWN:');
    const sortedCompanies = Object.entries(stats.companyBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 companies
    
    sortedCompanies.forEach(([company, count], index) => {
      const percentage = stats.nodes > 0 ? ((count / stats.nodes) * 100).toFixed(1) : '0.0';
      const prefix = index === sortedCompanies.length - 1 ? '└──' : '├──';
      console.log(`${prefix} ${company.padEnd(15)}: ${count.toString().padStart(3)} (${percentage}%)`);
    });

    // Validate data integrity
    this.validateDataIntegrity(persons, relationships);
  }

  /**
   * Validate data integrity and report issues
   */
  private validateDataIntegrity(persons: any[], relationships: any[]) {
    console.log('\n🔍 DATA INTEGRITY CHECK:');
    
    const personIds = new Set(persons.map(p => p.id));
    const invalidRelationships = relationships.filter(r => 
      !personIds.has(r.fromPersonId) || !personIds.has(r.toPersonId)
    );

    if (invalidRelationships.length > 0) {
      console.log(`⚠️  Found ${invalidRelationships.length} orphaned relationships`);
    } else {
      console.log('✅ All relationships have valid person references');
    }

    const duplicateRelationships = this.findDuplicateRelationships(relationships);
    if (duplicateRelationships.length > 0) {
      console.log(`⚠️  Found ${duplicateRelationships.length} duplicate relationships`);
    } else {
      console.log('✅ No duplicate relationships detected');
    }

    const personsWithoutRelationships = persons.filter(p => 
      !relationships.some(r => r.fromPersonId === p.id || r.toPersonId === p.id)
    ).length;

    if (personsWithoutRelationships > 0) {
      console.log(`ℹ️  ${personsWithoutRelationships} persons have no relationships`);
    }
  }

  /**
   * Find duplicate relationships
   */
  private findDuplicateRelationships(relationships: any[]): any[] {
    const seen = new Set();
    const duplicates: any[] = [];

    relationships.forEach(rel => {
      const key = `${rel.fromPersonId}-${rel.toPersonId}-${rel.relationshipType}`;
      if (seen.has(key)) {
        duplicates.push(rel);
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  }

  /**
   * Get current graph statistics
   */
  getStats(): GraphStats {
    return this.graphStats || this.getEmptyStats();
  }

  /**
   * Check if a rebuild is needed (based on data changes or time)
   */
  async shouldRebuild(): Promise<boolean> {
    if (!this.lastRebuildTime) return true;
    
    // Rebuild if it's been more than 1 hour
    const hoursSinceRebuild = (Date.now() - this.lastRebuildTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceRebuild > 1;
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): GraphStats {
    return {
      nodes: 0,
      edges: 0,
      relationshipBreakdown: {
        coworker: 0,
        family: 0,
        school: 0,
        greek_life: 0,
        professional: 0,
        other: 0
      },
      companyBreakdown: {},
      lastRebuild: new Date()
    };
  }

  /**
   * Force rebuild (for manual triggers)
   */
  async forceRebuild(): Promise<GraphStats> {
    this.lastRebuildTime = null;
    return await this.rebuildGraph();
  }
}

export const graphRebuildService = new GraphRebuildService();
export type { GraphStats };