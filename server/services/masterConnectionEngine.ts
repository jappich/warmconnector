interface MasterSearchRequest {
  targetName: string;
  targetCompany?: string;
  targetTitle?: string;
  searchMode: 'smart' | 'advanced' | 'comprehensive';
  userContext?: {
    name: string;
    company: string;
  };
  options?: {
    maxHops?: number;
    minStrength?: number;
    includeWeakTies?: boolean;
    enableExternalEnrichment?: boolean;
  };
}

interface ConnectionPath {
  path: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType?: string;
  }>;
  nodes: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType?: string;
  }>;
  hops: number;
  totalStrength: number;
  pathScore: number;
  confidenceScore: number;
  introductionStrategy: string;
}

export class MasterConnectionEngine {
  async findConnections(request: MasterSearchRequest): Promise<{
    found: boolean;
    paths: ConnectionPath[];
    smartMatches?: any[];
    totalResults: number;
    processingTime: number;
    strategy: string;
    source: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Route to appropriate engine based on search mode
      switch (request.searchMode) {
        case 'smart':
          return await this.runSmartSearch(request, startTime);
        case 'advanced':
          return await this.runAdvancedSearch(request, startTime);
        case 'comprehensive':
          return await this.runComprehensiveSearch(request, startTime);
        default:
          return await this.runSmartSearch(request, startTime);
      }
    } catch (error) {
      console.error('Master connection engine error:', error);
      return {
        found: false,
        paths: [],
        totalResults: 0,
        processingTime: Date.now() - startTime,
        strategy: 'Search failed - please try again',
        source: 'master_engine_error'
      };
    }
  }

  private async runSmartSearch(request: MasterSearchRequest, startTime: number) {
    // First try to find actual connection paths using advanced pathfinding
    const pathResult = await this.runAdvancedSearch(request, startTime);
    
    // If we found real connection paths, return those
    if (pathResult.found && pathResult.paths.length > 0) {
      return {
        ...pathResult,
        source: 'smart_pathfinding'
      };
    }
    
    // Fallback to intelligent matcher only if no paths found
    const { intelligentConnectionMatcher } = await import('./intelligentConnectionMatcher');
    
    const result = await intelligentConnectionMatcher.findByMinimalInfo(
      request.targetName,
      request.targetCompany || '',
      request.targetTitle
    );

    // Enhanced AI strategy with comprehensive analysis
    let strategy = result.strategy;
    if (result.found && result.matches.length > 0) {
      strategy = await this.generateEnhancedStrategy(request, result.matches);
    }

    return {
      found: result.found,
      paths: [],
      smartMatches: result.matches,
      totalResults: result.matches?.length || 0,
      processingTime: Date.now() - startTime,
      strategy,
      source: 'smart_matching'
    };
  }

  private async runAdvancedSearch(request: MasterSearchRequest, startTime: number) {
    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    const { persons } = await import('../../shared/schema');
    const { eq, and, ilike } = await import('drizzle-orm');
    
    // Find target person first
    const targetPerson = await db.select()
      .from(persons)
      .where(
        and(
          ilike(persons.name, `%${request.targetName}%`),
          request.targetCompany ? eq(persons.company, request.targetCompany) : undefined
        )
      )
      .limit(1);

    if (targetPerson.length === 0) {
      return {
        found: false,
        paths: [],
        totalResults: 0,
        processingTime: Date.now() - startTime,
        strategy: 'Target person not found in network database',
        source: 'advanced_pathfinding'
      };
    }

    const targetId = targetPerson[0].id;
    const allPaths: any[] = [];

    // 1-hop: Direct connections
    const directPaths = await db.execute(sql`
      SELECT 
        r.strength,
        p1.id as p1_id, p1.name as p1_name, p1.title as p1_title, p1.company as p1_company,
        p2.id as p2_id, p2.name as p2_name, p2.title as p2_title, p2.company as p2_company
      FROM relationships r
      JOIN persons p1 ON p1.id = 'demo-user-001'
      JOIN persons p2 ON p2.id = ${targetId}
      WHERE (r.from_person_id = 'demo-user-001' AND r.to_person_id = ${targetId})
         OR (r.from_person_id = ${targetId} AND r.to_person_id = 'demo-user-001')
      LIMIT 3
    `);

    directPaths.rows.forEach((row: any) => {
      allPaths.push({
        path: [
          { id: row.p1_id, name: row.p1_name, title: row.p1_title, company: row.p1_company },
          { id: row.p2_id, name: row.p2_name, title: row.p2_title, company: row.p2_company }
        ],
        hops: 1,
        totalStrength: row.strength || 85
      });
    });

    // 2-hop: Mutual connections
    const twoHopPaths = await db.execute(sql`
      SELECT 
        r1.strength as r1_strength, r2.strength as r2_strength,
        p1.id as p1_id, p1.name as p1_name, p1.title as p1_title, p1.company as p1_company,
        p2.id as p2_id, p2.name as p2_name, p2.title as p2_title, p2.company as p2_company,
        p3.id as p3_id, p3.name as p3_name, p3.title as p3_title, p3.company as p3_company
      FROM relationships r1
      JOIN relationships r2 ON r1.to_person_id = r2.from_person_id
      JOIN persons p1 ON p1.id = 'demo-user-001'
      JOIN persons p2 ON p2.id = r1.to_person_id
      JOIN persons p3 ON p3.id = ${targetId}
      WHERE r1.from_person_id = 'demo-user-001' 
        AND r2.to_person_id = ${targetId}
        AND p2.id != 'demo-user-001' 
        AND p2.id != ${targetId}
      LIMIT 5
    `);

    twoHopPaths.rows.forEach((row: any) => {
      allPaths.push({
        path: [
          { id: row.p1_id, name: row.p1_name, title: row.p1_title, company: row.p1_company },
          { id: row.p2_id, name: row.p2_name, title: row.p2_title, company: row.p2_company },
          { id: row.p3_id, name: row.p3_name, title: row.p3_title, company: row.p3_company }
        ],
        hops: 2,
        totalStrength: Math.min((row.r1_strength || 70) + (row.r2_strength || 70), 95)
      });
    });

    // Sort by hops first, then by strength
    allPaths.sort((a, b) => {
      if (a.hops !== b.hops) return a.hops - b.hops;
      return b.totalStrength - a.totalStrength;
    });

    const finalPaths = allPaths.slice(0, 8);
    const strategy = finalPaths.length > 0 
      ? `Found ${finalPaths.length} connection pathway(s) with up to ${Math.max(...finalPaths.map(p => p.hops))} degrees of separation. Direct connections available.`
      : 'No connection pathways found in current network.';

    return {
      found: finalPaths.length > 0,
      paths: finalPaths,
      totalResults: finalPaths.length,
      processingTime: Date.now() - startTime,
      strategy,
      source: 'advanced_pathfinding'
    };
  }

  private async runComprehensiveSearch(request: MasterSearchRequest, startTime: number) {
    // Run both smart and advanced searches, then combine results
    const smartResult = await this.runSmartSearch(request, startTime);
    const advancedResult = await this.runAdvancedSearch(request, startTime);

    // Optionally integrate external enrichment if enabled
    let externalResults: any[] = [];
    if (request.options?.enableExternalEnrichment) {
      externalResults = await this.runExternalEnrichment(request);
    }

    // Generate comprehensive strategy with multiple approach options
    const strategy = await this.generateComprehensiveStrategy(
      request,
      smartResult,
      advancedResult,
      externalResults
    );

    return {
      found: smartResult.found || advancedResult.found,
      paths: advancedResult.paths,
      smartMatches: smartResult.smartMatches,
      totalResults: (smartResult.totalResults || 0) + (advancedResult.totalResults || 0),
      processingTime: Date.now() - startTime,
      strategy,
      source: 'comprehensive_analysis'
    };
  }

  private async findPersonIdByName(name: string, company?: string): Promise<string | null> {
    // This would query your database to find the person
    // Simplified implementation for now
    return `person-${name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private async runExternalEnrichment(request: MasterSearchRequest) {
    // Integrate with external services when available
    const results: any[] = [];
    
    try {
      // Use the comprehensive people search service
      const { comprehensivePeopleSearchService } = await import('./comprehensivePeopleSearchService');
      
      const userData = {
        name: request.targetName,
        company: request.targetCompany,
        title: request.targetTitle
      };

      // Skip external connections for now due to service interface mismatch
      // const externalConnections = await comprehensivePeopleSearchService.findConnections(userData);
      // if (Array.isArray(externalConnections)) {
      //   results.push(...externalConnections);
      // }
    } catch (error) {
      console.log('External enrichment not available:', error instanceof Error ? error.message : String(error));
    }

    return results;
  }

  private async generateEnhancedStrategy(request: MasterSearchRequest, matches: any[]): Promise<string> {
    if (!process.env.OPENAI_API_KEY || matches.length === 0) {
      return 'Smart matches found - use the highest confidence connections for introductions';
    }

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `
      NETWORKING STRATEGY ANALYSIS

      Target: ${request.targetName} at ${request.targetCompany} ${request.targetTitle ? `(${request.targetTitle})` : ''}
      
      Available Smart Matches:
      ${matches.slice(0, 3).map((m, i) => 
        `${i + 1}. ${m.name} at ${m.company} (${m.title || 'Unknown role'}) - ${m.confidenceScore}% match
           Connection Type: ${m.connectionType}
           Reasoning: ${m.reasoning}`
      ).join('\n')}

      Provide a strategic networking approach:
      1. Prioritized outreach sequence
      2. Key value propositions for each connection
      3. Specific conversation starters
      4. Timeline and follow-up strategy

      Keep response under 150 words, focus on actionable insights.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'Strategic networking approach recommended based on connection analysis';
    } catch (error) {
      console.error('AI strategy generation error:', error);
      return 'Strategic networking approach recommended based on connection analysis';
    }
  }

  private async generatePathInsights(path: ConnectionPath, request: MasterSearchRequest): Promise<string> {
    const pathScore = path.pathScore || path.totalStrength || 75;
    const confidenceScore = path.confidenceScore || path.totalStrength || 75;
    
    if (!process.env.OPENAI_API_KEY) {
      return `${path.hops}-hop path with ${pathScore.toFixed(1)}/100 strength score`;
    }

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const pathNames = (path.nodes || path.path).map((n: any) => n.name).join(' → ');
      
      const prompt = `
      CONNECTION PATH ANALYSIS

      Path: ${pathNames}
      Hops: ${path.hops}
      Path Score: ${pathScore.toFixed(1)}/100
      Confidence: ${confidenceScore.toFixed(1)}%
      
      Provide tactical introduction advice:
      1. Which connection to approach first
      2. Key talking points for the introduction request
      3. Potential obstacles and how to address them
      
      Keep under 80 words, be specific and actionable.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 120,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || `${path.hops}-hop path with ${pathScore.toFixed(1)}/100 strength score`;
    } catch (error) {
      console.error('Path insights generation error:', error);
      return `${path.hops}-hop path with ${pathScore.toFixed(1)}/100 strength score`;
    }
  }

  private async generateAdvancedStrategy(request: MasterSearchRequest, paths: ConnectionPath[]): Promise<string> {
    if (paths.length === 0) {
      return 'No advanced connection paths found. Try smart search for industry peer connections.';
    }

    const bestPath = paths[0];
    return `Found ${paths.length} connection path${paths.length > 1 ? 's' : ''} to ${request.targetName}. Best route: ${bestPath.hops}-hop path with ${bestPath.pathScore.toFixed(1)}/100 strength. Strategy: ${bestPath.introductionStrategy}`;
  }

  private async generateComprehensiveStrategy(
    request: MasterSearchRequest,
    smartResult: any,
    advancedResult: any,
    externalResults: any[]
  ): Promise<string> {
    const totalConnections = (smartResult.totalResults || 0) + (advancedResult.totalResults || 0) + externalResults.length;
    
    if (totalConnections === 0) {
      return 'No connections found through any search method. Consider expanding search criteria or building network in this space.';
    }

    let strategy = `Comprehensive analysis found ${totalConnections} connection opportunities to ${request.targetName}.`;
    
    if (smartResult.found) {
      strategy += ` Smart matching identified ${smartResult.totalResults} industry/functional peers.`;
    }
    
    if (advancedResult.found) {
      strategy += ` Advanced pathfinding discovered ${advancedResult.totalResults} multi-hop paths.`;
    }
    
    if (externalResults.length > 0) {
      strategy += ` External enrichment added ${externalResults.length} additional data points.`;
    }

    strategy += ' Recommend starting with highest-confidence direct connections before attempting longer paths.';

    return strategy;
  }
}

export const masterConnectionEngine = new MasterConnectionEngine();