import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, or, and, like, ilike } from 'drizzle-orm';

interface MasterSearchRequest {
  targetName: string;
  targetCompany?: string;
  targetTitle?: string;
  searchMode: 'smart' | 'advanced' | 'comprehensive';
  userContext?: {
    name: string;
    company: string;
    title?: string;
  };
  options?: {
    maxHops?: number;
    minStrength?: number;
    includeWeakTies?: boolean;
    enableExternalEnrichment?: boolean;
  };
}

interface ConnectionPath {
  nodes: Array<{
    id: string;
    name: string;
    company?: string;
    title?: string;
    relationshipType?: string;
  }>;
  hops: number;
  pathScore: number;
  confidenceScore: number;
  introductionStrategy: string;
  strengthFactors: string[];
  aiInsights?: string;
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
    // Use intelligent connection matcher for minimal input scenarios
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
    // Use advanced connection finder for detailed pathfinding
    const { advancedConnectionFinder } = await import('./advancedConnectionFinder');
    
    await advancedConnectionFinder.initialize();
    
    const options = {
      maxHops: request.options?.maxHops || 6,
      minStrength: request.options?.minStrength || 30,
      preferredCompanies: request.targetCompany ? [request.targetCompany] : undefined,
      includeWeakTies: request.options?.includeWeakTies || false
    };
    
    const paths = await advancedConnectionFinder.findBestPaths(
      'user-1', // Current user
      request.targetName,
      options
    );

    // Add AI insights to best paths
    if (paths.length > 0) {
      for (let i = 0; i < Math.min(3, paths.length); i++) {
        paths[i].aiInsights = await this.generatePathInsights(paths[i], request);
      }
    }

    return {
      found: paths.length > 0,
      paths,
      totalResults: paths.length,
      processingTime: Date.now() - startTime,
      strategy: await this.generateAdvancedStrategy(request, paths),
      source: 'advanced_pathfinding'
    };
  }

  private async runComprehensiveSearch(request: MasterSearchRequest, startTime: number) {
    // Run both smart and advanced searches, then combine results
    const smartResult = await this.runSmartSearch(request, startTime);
    const advancedResult = await this.runAdvancedSearch(request, startTime);

    // Optionally integrate external enrichment if enabled
    let externalResults = [];
    if (request.options?.enableExternalEnrichment) {
      externalResults = await this.runExternalEnrichment(request);
    }

    // Combine and rank all results using advanced scoring
    const combinedPaths = this.combineAndRankResults(
      advancedResult.paths,
      smartResult.smartMatches || [],
      externalResults
    );

    // Generate comprehensive strategy with multiple approach options
    const strategy = await this.generateComprehensiveStrategy(
      request,
      combinedPaths,
      smartResult.smartMatches || []
    );

    return {
      found: combinedPaths.length > 0 || (smartResult.smartMatches?.length || 0) > 0,
      paths: combinedPaths,
      smartMatches: smartResult.smartMatches,
      totalResults: combinedPaths.length + (smartResult.smartMatches?.length || 0),
      processingTime: Date.now() - startTime,
      strategy,
      source: 'comprehensive_analysis'
    };
  }

  private combineAndRankResults(
    paths: ConnectionPath[],
    smartMatches: any[],
    externalResults: any[]
  ): ConnectionPath[] {
    // Convert smart matches to path format for unified processing
    const convertedPaths: ConnectionPath[] = smartMatches.map((match, index) => ({
      nodes: [
        { id: 'user', name: 'You', relationshipType: 'self' },
        {
          id: match.id,
          name: match.name,
          company: match.company,
          title: match.title,
          relationshipType: match.relationshipType || 'direct'
        }
      ],
      hops: 1,
      pathScore: match.strength || 75,
      confidenceScore: match.confidence || 80,
      introductionStrategy: this.generateDirectIntroStrategy(match),
      strengthFactors: match.strengthFactors || ['Direct connection', 'High confidence match']
    }));

    // Combine all paths and apply advanced ranking
    const allPaths = [...paths, ...convertedPaths];
    
    return allPaths
      .map(path => this.enhancePathScoring(path))
      .sort((a, b) => this.calculatePathRanking(b) - this.calculatePathRanking(a))
      .slice(0, 10); // Top 10 results
  }

  private enhancePathScoring(path: ConnectionPath): ConnectionPath {
    // Advanced scoring algorithm considering multiple factors
    let enhancedScore = path.pathScore;
    
    // Hop penalty (shorter paths preferred)
    const hopPenalty = Math.max(0, (path.hops - 1) * 10);
    enhancedScore -= hopPenalty;
    
    // Company alignment bonus
    const hasCompanyAlignment = path.nodes.some(node => 
      node.company && ['Meta', 'Google', 'Microsoft', 'Apple', 'Amazon'].includes(node.company)
    );
    if (hasCompanyAlignment) enhancedScore += 15;
    
    // Title relevance bonus
    const hasSeniorTitle = path.nodes.some(node =>
      node.title && ['CEO', 'CTO', 'VP', 'Director', 'Senior', 'Lead'].some(keyword =>
        node.title.includes(keyword)
      )
    );
    if (hasSeniorTitle) enhancedScore += 10;
    
    // Confidence boost for high-quality connections
    if (path.confidenceScore > 85) enhancedScore += 5;
    
    return {
      ...path,
      pathScore: Math.min(100, Math.max(0, enhancedScore))
    };
  }

  private calculatePathRanking(path: ConnectionPath): number {
    // Weighted ranking considering multiple factors
    const weights = {
      pathScore: 0.4,
      confidenceScore: 0.3,
      hopBonus: 0.2, // Inverse of hops
      strengthFactors: 0.1
    };
    
    const hopBonus = Math.max(0, 100 - (path.hops * 15));
    const strengthBonus = path.strengthFactors.length * 5;
    
    return (
      path.pathScore * weights.pathScore +
      path.confidenceScore * weights.confidenceScore +
      hopBonus * weights.hopBonus +
      strengthBonus * weights.strengthFactors
    );
  }

  private generateDirectIntroStrategy(match: any): string {
    const strategies = [
      "Send a personalized LinkedIn message mentioning your shared connection",
      "Request a warm introduction through your mutual contact",
      "Attend the same industry events or conferences",
      "Engage with their content on social media before reaching out",
      "Find a common professional interest to start the conversation"
    ];
    
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private async generateEnhancedStrategy(request: MasterSearchRequest, matches: any[]): Promise<string> {
    const bestMatch = matches[0];
    const totalMatches = matches.length;
    
    let strategy = `Found ${totalMatches} potential connection${totalMatches > 1 ? 's' : ''} to ${request.targetName}`;
    
    if (bestMatch) {
      if (bestMatch.relationshipType === 'COWORKER') {
        strategy += `. Your strongest path is through ${bestMatch.name} at ${bestMatch.company}. Since you worked together, they can provide a warm introduction with personal context about your collaboration.`;
      } else if (bestMatch.relationshipType === 'EDUCATION') {
        strategy += `. Your alumni connection with ${bestMatch.name} provides an excellent foundation. Mention your shared educational background when requesting an introduction.`;
      } else {
        strategy += `. Your connection with ${bestMatch.name} offers a direct path. Leverage your ${bestMatch.relationshipType.toLowerCase()} relationship for a personal introduction.`;
      }
      
      strategy += ` Recommended approach: ${bestMatch.introductionStrategy || this.generateDirectIntroStrategy(bestMatch)}`;
    }
    
    return strategy;
  }

  private async generateAdvancedStrategy(request: MasterSearchRequest, paths: ConnectionPath[]): Promise<string> {
    if (paths.length === 0) {
      return `No direct paths found to ${request.targetName}. Consider expanding your search criteria or building connections in their industry first.`;
    }
    
    const bestPath = paths[0];
    const pathLength = bestPath.hops;
    
    let strategy = `Found ${paths.length} connection path${paths.length > 1 ? 's' : ''} to ${request.targetName}. `;
    
    if (pathLength === 1) {
      strategy += `You have a direct connection! ${bestPath.introductionStrategy}`;
    } else if (pathLength === 2) {
      const intermediary = bestPath.nodes[1];
      strategy += `Your best path is through ${intermediary.name}${intermediary.company ? ` at ${intermediary.company}` : ''}. `;
      strategy += `This is a strong 2-hop path with ${bestPath.confidenceScore}% confidence. `;
      strategy += `${bestPath.introductionStrategy}`;
    } else {
      strategy += `Your shortest path requires ${pathLength} connections. `;
      strategy += `While longer paths can work, consider building stronger relationships in ${request.targetCompany || 'their industry'} first. `;
      strategy += `Focus on connecting with people who are 1-2 degrees away from your target.`;
    }
    
    if (bestPath.aiInsights) {
      strategy += ` ${bestPath.aiInsights}`;
    }
    
    return strategy;
  }

  private async generateComprehensiveStrategy(
    request: MasterSearchRequest,
    paths: ConnectionPath[],
    smartMatches: any[]
  ): Promise<string> {
    const totalOptions = paths.length + smartMatches.length;
    
    if (totalOptions === 0) {
      return `No connections found to ${request.targetName}${request.targetCompany ? ` at ${request.targetCompany}` : ''}. Consider: 1) Expanding to related companies, 2) Attending industry events, 3) Building connections in their sector first, 4) Using LinkedIn to find mutual connections.`;
    }
    
    let strategy = `Comprehensive analysis found ${totalOptions} potential connection routes to ${request.targetName}. `;
    
    // Prioritize by path quality
    const directConnections = smartMatches.filter(m => m.relationshipType === 'COWORKER' || m.relationshipType === 'EDUCATION');
    const shortPaths = paths.filter(p => p.hops <= 2);
    const longerPaths = paths.filter(p => p.hops > 2);
    
    if (directConnections.length > 0) {
      strategy += `\n\nPRIMARY STRATEGY: You have ${directConnections.length} strong direct connection${directConnections.length > 1 ? 's' : ''}. `;
      strategy += `Start with ${directConnections[0].name} - your ${directConnections[0].relationshipType.toLowerCase()} connection.`;
    } else if (shortPaths.length > 0) {
      const bestShort = shortPaths[0];
      const intermediary = bestShort.nodes[1];
      strategy += `\n\nPRIMARY STRATEGY: Your best path is through ${intermediary.name}${intermediary.company ? ` at ${intermediary.company}` : ''}. `;
      strategy += `This ${bestShort.hops}-hop path has ${bestShort.confidenceScore}% confidence.`;
    }
    
    if (longerPaths.length > 0) {
      strategy += `\n\nALTERNATIVE APPROACHES: ${longerPaths.length} longer path${longerPaths.length > 1 ? 's' : ''} available. `;
      strategy += `Consider these if primary routes don't respond.`;
    }
    
    // Add strategic recommendations
    strategy += `\n\nRECOMMENDATIONS:`;
    strategy += `\n• Personalize your outreach mentioning mutual connections`;
    strategy += `\n• Research shared interests or professional background`;
    strategy += `\n• Consider timing - avoid end of quarter/year periods`;
    strategy += `\n• Follow up respectfully if no initial response`;
    
    return strategy;
  }

  private async generatePathInsights(path: ConnectionPath, request: MasterSearchRequest): Promise<string> {
    const insights = [];
    
    // Analyze path strength
    if (path.confidenceScore > 85) {
      insights.push("High-confidence path with strong relationship indicators");
    } else if (path.confidenceScore < 60) {
      insights.push("Lower confidence - consider verifying relationship strength before proceeding");
    }
    
    // Company insights
    const companies = path.nodes.map(n => n.company).filter(Boolean);
    const uniqueCompanies = [...new Set(companies)];
    if (uniqueCompanies.length > 2) {
      insights.push(`Path spans ${uniqueCompanies.length} companies - good industry diversity`);
    }
    
    // Title insights
    const seniorRoles = path.nodes.filter(n => 
      n.title && ['CEO', 'CTO', 'VP', 'Director', 'SVP', 'Chief'].some(keyword => 
        n.title.includes(keyword)
      )
    );
    if (seniorRoles.length > 0) {
      insights.push(`Includes ${seniorRoles.length} senior-level contact${seniorRoles.length > 1 ? 's' : ''} - high influence potential`);
    }
    
    return insights.length > 0 ? insights.join('. ') + '.' : '';
  }

  private async runExternalEnrichment(request: MasterSearchRequest) {
    // Integrate with external services when available
    const results = [];
    
    try {
      // Use the comprehensive people search service
      const { comprehensivePeopleSearchService } = await import('./comprehensivePeopleSearchService');
      
      const userData = {
        name: request.targetName,
        company: request.targetCompany,
        title: request.targetTitle
      };

      const externalConnections = await comprehensivePeopleSearchService.findConnections(
        userData,
        request.userContext || { name: 'User', company: 'Your Company' }
      );

      results.push(...externalConnections);
    } catch (error) {
      console.log('External enrichment not available:', error.message);
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
    if (!process.env.OPENAI_API_KEY) {
      return `${path.hops}-hop path with ${path.pathScore.toFixed(1)}/100 strength score`;
    }

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const pathNames = path.nodes.map(n => n.name).join(' → ');
      
      const prompt = `
      CONNECTION PATH ANALYSIS

      Path: ${pathNames}
      Hops: ${path.hops}
      Path Score: ${path.pathScore.toFixed(1)}/100
      Confidence: ${path.confidenceScore.toFixed(1)}%
      
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

      return response.choices[0]?.message?.content || `${path.hops}-hop path with ${path.pathScore.toFixed(1)}/100 strength score`;
    } catch (error) {
      console.error('Path insights generation error:', error);
      return `${path.hops}-hop path with ${path.pathScore.toFixed(1)}/100 strength score`;
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