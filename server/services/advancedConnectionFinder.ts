import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, or, and, like, ilike } from 'drizzle-orm';

interface ConnectionNode {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  location?: string;
  strength?: number;
  commonConnections?: number;
  platforms?: string[];
}

interface ConnectionPath {
  nodes: ConnectionNode[];
  totalStrength: number;
  averageStrength: number;
  pathScore: number;
  hops: number;
  strengthFactors: {
    directStrength: number;
    mutualConnections: number;
    companyAlignment: number;
    locationAlignment: number;
    platformDiversity: number;
  };
  introductionStrategy: string;
  confidenceScore: number;
}

interface PathfindingOptions {
  maxHops: number;
  minStrength: number;
  preferredCompanies?: string[];
  preferredLocations?: string[];
  excludeCompanies?: string[];
  prioritizeRecentConnections?: boolean;
  includeWeakTies?: boolean;
}

export class AdvancedConnectionFinder {
  private adjacencyMap: Map<string, Set<string>> = new Map();
  private nodeData: Map<string, ConnectionNode> = new Map();
  private edgeStrength: Map<string, number> = new Map();
  private lastUpdate: Date = new Date(0);

  async initialize(): Promise<void> {
    console.log('Initializing advanced connection finder...');
    await this.buildGraph();
    this.lastUpdate = new Date();
  }

  private async buildGraph(): Promise<void> {
    // Clear existing data
    this.adjacencyMap.clear();
    this.nodeData.clear();
    this.edgeStrength.clear();

    // Load all persons
    const allPersons = await db.select().from(persons);
    
    // Build node data
    for (const person of allPersons) {
      const node: ConnectionNode = {
        id: person.id,
        name: person.name || '',
        company: person.company || '',
        title: person.title || '',
        email: person.email || '',
        location: person.location || undefined,
        platforms: this.extractPlatforms(person)
      };
      
      this.nodeData.set(person.id, node);
      this.adjacencyMap.set(person.id, new Set());
    }

    // Load all relationships
    const allRelationships = await db.select().from(relationships);
    
    // Build adjacency map and edge strengths
    for (const rel of allRelationships) {
      if (rel.fromPersonId && rel.toPersonId) {
        // Add bidirectional edges
        this.adjacencyMap.get(rel.fromPersonId)?.add(rel.toPersonId);
        this.adjacencyMap.get(rel.toPersonId)?.add(rel.fromPersonId);
        
        // Store edge strength (bidirectional)
        const edgeKey1 = `${rel.fromPersonId}-${rel.toPersonId}`;
        const edgeKey2 = `${rel.toPersonId}-${rel.fromPersonId}`;
        const strength = rel.strength || 50;
        
        this.edgeStrength.set(edgeKey1, strength);
        this.edgeStrength.set(edgeKey2, strength);
      }
    }

    console.log(`Graph built: ${this.nodeData.size} nodes, ${allRelationships.length} edges`);
  }

  private extractPlatforms(person: any): string[] {
    const platforms: string[] = [];
    if (person.linkedinProfile) platforms.push('linkedin');
    if (person.twitterHandle) platforms.push('twitter');
    if (person.githubProfile) platforms.push('github');
    if (person.instagramHandle) platforms.push('instagram');
    if (person.facebookProfile) platforms.push('facebook');
    return platforms;
  }

  async findBestPaths(
    fromPersonId: string, 
    toPersonId: string, 
    options: PathfindingOptions = { maxHops: 6, minStrength: 30 }
  ): Promise<ConnectionPath[]> {
    await this.refreshIfNeeded();

    if (!this.nodeData.has(fromPersonId) || !this.nodeData.has(toPersonId)) {
      return [];
    }

    // Find all possible paths using advanced BFS with path ranking
    const allPaths = this.findAllPaths(fromPersonId, toPersonId, options.maxHops);
    
    // Score and rank paths
    const scoredPaths = allPaths.map(path => this.scorePath(path, options));
    
    // Filter by minimum strength and sort by score
    return scoredPaths
      .filter(path => path.averageStrength >= options.minStrength)
      .sort((a, b) => b.pathScore - a.pathScore)
      .slice(0, 10); // Return top 10 paths
  }

  private findAllPaths(fromId: string, toId: string, maxHops: number): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    
    const dfs = (currentId: string, path: string[], hops: number) => {
      if (hops > maxHops) return;
      
      if (currentId === toId && path.length > 1) {
        paths.push([...path]);
        return;
      }

      if (visited.has(currentId)) return;
      visited.add(currentId);

      const neighbors = this.adjacencyMap.get(currentId) || new Set();
      for (const neighborId of neighbors) {
        if (!path.includes(neighborId)) {
          dfs(neighborId, [...path, neighborId], hops + 1);
        }
      }

      visited.delete(currentId);
    };

    dfs(fromId, [fromId], 0);
    return paths;
  }

  private scorePath(pathIds: string[], options: PathfindingOptions): ConnectionPath {
    const nodes = pathIds.map(id => this.nodeData.get(id)!);
    const hops = pathIds.length - 1;
    
    // Calculate connection strengths
    const edgeStrengths: number[] = [];
    for (let i = 0; i < pathIds.length - 1; i++) {
      const edgeKey = `${pathIds[i]}-${pathIds[i + 1]}`;
      const strength = this.edgeStrength.get(edgeKey) || 50;
      edgeStrengths.push(strength);
    }

    const totalStrength = edgeStrengths.reduce((sum, s) => sum + s, 0);
    const averageStrength = totalStrength / edgeStrengths.length;
    const weakestLink = Math.min(...edgeStrengths);

    // Calculate strength factors
    const strengthFactors = this.calculateStrengthFactors(nodes, edgeStrengths);
    
    // Calculate path score with multiple factors
    let pathScore = 0;
    
    // Base score from connection strength (40% weight)
    pathScore += averageStrength * 0.4;
    
    // Penalty for longer paths (20% weight) - diminishing returns
    const hopPenalty = Math.max(0, 100 - (hops - 1) * 15);
    pathScore += hopPenalty * 0.2;
    
    // Bonus for strong weakest link (20% weight)
    pathScore += weakestLink * 0.2;
    
    // Bonus for company/industry alignment (10% weight)
    pathScore += strengthFactors.companyAlignment * 0.1;
    
    // Bonus for platform diversity (5% weight)
    pathScore += strengthFactors.platformDiversity * 0.05;
    
    // Bonus for location alignment (5% weight)
    pathScore += strengthFactors.locationAlignment * 0.05;

    // Generate introduction strategy
    const introductionStrategy = this.generateIntroductionStrategy(nodes, strengthFactors);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(strengthFactors, hops, averageStrength);

    return {
      nodes,
      totalStrength,
      averageStrength,
      pathScore,
      hops,
      strengthFactors,
      introductionStrategy,
      confidenceScore
    };
  }

  private calculateStrengthFactors(nodes: ConnectionNode[], edgeStrengths: number[]) {
    const directStrength = edgeStrengths.reduce((sum, s) => sum + s, 0) / edgeStrengths.length;
    
    // Calculate mutual connections (simplified)
    const mutualConnections = this.estimateMutualConnections(nodes);
    
    // Company alignment - bonus if people work at similar companies or industries
    const companyAlignment = this.calculateCompanyAlignment(nodes);
    
    // Location alignment - bonus if people are in same city/region
    const locationAlignment = this.calculateLocationAlignment(nodes);
    
    // Platform diversity - bonus for having multiple platforms
    const platformDiversity = this.calculatePlatformDiversity(nodes);

    return {
      directStrength,
      mutualConnections,
      companyAlignment,
      locationAlignment,
      platformDiversity
    };
  }

  private estimateMutualConnections(nodes: ConnectionNode[]): number {
    // Simplified mutual connection estimation
    let score = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      const node1Connections = this.adjacencyMap.get(nodes[i].id) || new Set();
      const node2Connections = this.adjacencyMap.get(nodes[i + 1].id) || new Set();
      
      const mutualCount = Array.from(node1Connections).filter(id => 
        node2Connections.has(id)
      ).length;
      
      score += mutualCount * 10; // 10 points per mutual connection
    }
    return Math.min(score, 100);
  }

  private calculateCompanyAlignment(nodes: ConnectionNode[]): number {
    let score = 0;
    const companies = nodes.map(n => n.company.toLowerCase()).filter(c => c);
    
    // Bonus for tech companies, consulting, finance clusters
    const techCompanies = ['google', 'meta', 'apple', 'microsoft', 'amazon', 'netflix', 'tesla', 'openai', 'anthropic'];
    const hasMultipleTech = companies.filter(c => techCompanies.some(tech => c.includes(tech))).length > 1;
    
    if (hasMultipleTech) score += 30;
    
    // Bonus for same industry connections
    const uniqueCompanies = new Set(companies);
    if (uniqueCompanies.size < companies.length) score += 20;
    
    return Math.min(score, 100);
  }

  private calculateLocationAlignment(nodes: ConnectionNode[]): number {
    let score = 0;
    const locations = nodes.map(n => n.location?.toLowerCase()).filter(l => l);
    
    // Bonus for same city/region
    const sameCity = locations.some(loc => 
      locations.filter(l => l === loc).length > 1
    );
    
    if (sameCity) score += 40;
    
    // Bonus for major tech hubs
    const techHubs = ['san francisco', 'palo alto', 'mountain view', 'menlo park', 'new york', 'seattle'];
    const inTechHub = locations.some(loc => 
      techHubs.some(hub => loc?.includes(hub))
    );
    
    if (inTechHub) score += 20;
    
    return Math.min(score, 100);
  }

  private calculatePlatformDiversity(nodes: ConnectionNode[]): number {
    const allPlatforms = new Set<string>();
    nodes.forEach(node => {
      node.platforms?.forEach(platform => allPlatforms.add(platform));
    });
    
    return Math.min(allPlatforms.size * 20, 100); // 20 points per platform type
  }

  private generateIntroductionStrategy(nodes: ConnectionNode[], factors: any): string {
    if (nodes.length <= 2) return 'Direct connection available';
    
    const strategies = [];
    
    if (factors.companyAlignment > 50) {
      strategies.push('Leverage shared industry connections');
    }
    
    if (factors.locationAlignment > 50) {
      strategies.push('Use local network proximity');
    }
    
    if (factors.mutualConnections > 30) {
      strategies.push('Highlight mutual connections');
    }
    
    if (factors.platformDiversity > 60) {
      strategies.push('Multi-platform approach available');
    }
    
    if (strategies.length === 0) {
      return `${nodes.length - 1}-step introduction through professional network`;
    }
    
    return strategies.join(', ');
  }

  private calculateConfidenceScore(factors: any, hops: number, averageStrength: number): number {
    let confidence = 0;
    
    // Base confidence from strength
    confidence += Math.min(averageStrength / 100 * 50, 50);
    
    // Penalty for longer paths
    confidence += Math.max(0, 30 - hops * 5);
    
    // Bonus from strength factors
    confidence += (factors.mutualConnections + factors.companyAlignment + factors.locationAlignment) / 3 * 0.2;
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  private async refreshIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() > 5 * 60 * 1000) { // 5 minutes
      await this.buildGraph();
      this.lastUpdate = now;
    }
  }

  async findByCompany(companyName: string): Promise<ConnectionNode[]> {
    await this.refreshIfNeeded();
    
    const matches: ConnectionNode[] = [];
    for (const node of this.nodeData.values()) {
      if (node.company.toLowerCase().includes(companyName.toLowerCase())) {
        matches.push(node);
      }
    }
    
    return matches;
  }

  async findByName(name: string): Promise<ConnectionNode[]> {
    await this.refreshIfNeeded();
    
    const matches: ConnectionNode[] = [];
    const searchTerm = name.toLowerCase();
    
    for (const node of this.nodeData.values()) {
      if (node.name.toLowerCase().includes(searchTerm)) {
        matches.push(node);
      }
    }
    
    return matches;
  }

  getNetworkStats() {
    return {
      totalNodes: this.nodeData.size,
      totalEdges: this.edgeStrength.size / 2, // Bidirectional edges counted twice
      averageConnections: Array.from(this.adjacencyMap.values()).reduce((sum, set) => sum + set.size, 0) / this.nodeData.size,
      lastUpdate: this.lastUpdate
    };
  }
}

export const advancedConnectionFinder = new AdvancedConnectionFinder();