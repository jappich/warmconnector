import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and, or, desc, asc, count } from 'drizzle-orm';

interface NetworkingInsight {
  type: 'opportunity' | 'strategy' | 'timing' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  data?: any;
}

interface NetworkAnalytics {
  totalConnections: number;
  strongConnections: number;
  industryDiversity: number;
  seniorityLevels: {
    junior: number;
    mid: number;
    senior: number;
    executive: number;
  };
  companyDistribution: Array<{
    company: string;
    count: number;
    percentage: number;
  }>;
  relationshipTypes: Array<{
    type: string;
    count: number;
    strength: number;
  }>;
  networkGrowthTrend: Array<{
    month: string;
    connections: number;
    quality: number;
  }>;
}

export class NetworkingInsightsService {
  async generatePersonalizedInsights(userId: string = 'user-1'): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];
    
    try {
      // Get comprehensive network analytics
      const analytics = await this.getNetworkAnalytics(userId);
      
      // Generate various types of insights
      insights.push(...await this.analyzeNetworkGaps(analytics));
      insights.push(...await this.identifyStrengthOpportunities(analytics));
      insights.push(...await this.suggestStrategicConnections(analytics));
      insights.push(...await this.analyzeNetworkHealth(analytics));
      insights.push(...await this.recommendTimingStrategies());
      
      // Sort by priority and relevance
      return insights
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, 8); // Top 8 most relevant insights
        
    } catch (error) {
      console.error('Error generating networking insights:', error);
      return [{
        type: 'strategy',
        priority: 'medium',
        title: 'Build Your Network Foundation',
        description: 'Start building meaningful professional connections to unlock networking opportunities.',
        actionItems: [
          'Upload your contact list to identify existing connections',
          'Connect with colleagues and classmates on LinkedIn',
          'Join industry-specific professional groups'
        ]
      }];
    }
  }

  private async getNetworkAnalytics(userId: string): Promise<NetworkAnalytics> {
    // Get all connections for the user
    const userConnections = await db
      .select({
        personId: relationships.personId2,
        person: persons,
        relationshipType: relationships.relationshipType,
        strength: relationships.strength,
        createdAt: relationships.createdAt
      })
      .from(relationships)
      .innerJoin(persons, eq(relationships.personId2, persons.id))
      .where(eq(relationships.personId1, userId));

    const totalConnections = userConnections.length;
    const strongConnections = userConnections.filter(c => (c.strength || 50) > 75).length;

    // Calculate industry diversity
    const companies = [...new Set(userConnections.map(c => c.person.company).filter(Boolean))];
    const industryDiversity = Math.min(100, (companies.length / Math.max(totalConnections, 1)) * 100);

    // Analyze seniority levels
    const seniorityLevels = {
      junior: 0,
      mid: 0,
      senior: 0,
      executive: 0
    };

    userConnections.forEach(conn => {
      const title = conn.person.title?.toLowerCase() || '';
      if (title.includes('ceo') || title.includes('cto') || title.includes('president') || title.includes('founder')) {
        seniorityLevels.executive++;
      } else if (title.includes('vp') || title.includes('director') || title.includes('head of')) {
        seniorityLevels.senior++;
      } else if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
        seniorityLevels.mid++;
      } else {
        seniorityLevels.junior++;
      }
    });

    // Company distribution
    const companyCount: Record<string, number> = {};
    userConnections.forEach(conn => {
      if (conn.person.company) {
        companyCount[conn.person.company] = (companyCount[conn.person.company] || 0) + 1;
      }
    });

    const companyDistribution = Object.entries(companyCount)
      .map(([company, count]) => ({
        company,
        count,
        percentage: (count / totalConnections) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Relationship types analysis
    const relationshipCount: Record<string, { count: number; totalStrength: number }> = {};
    userConnections.forEach(conn => {
      const type = conn.relationshipType || 'UNKNOWN';
      if (!relationshipCount[type]) {
        relationshipCount[type] = { count: 0, totalStrength: 0 };
      }
      relationshipCount[type].count++;
      relationshipCount[type].totalStrength += conn.strength || 50;
    });

    const relationshipTypes = Object.entries(relationshipCount)
      .map(([type, data]) => ({
        type,
        count: data.count,
        strength: data.totalStrength / data.count
      }))
      .sort((a, b) => b.count - a.count);

    // Network growth trend (mock data for now)
    const networkGrowthTrend = this.generateMockGrowthTrend();

    return {
      totalConnections,
      strongConnections,
      industryDiversity,
      seniorityLevels,
      companyDistribution,
      relationshipTypes,
      networkGrowthTrend
    };
  }

  private async analyzeNetworkGaps(analytics: NetworkAnalytics): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];

    // Executive connection gap
    if (analytics.seniorityLevels.executive < 3 && analytics.totalConnections > 20) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: 'Expand Executive Network',
        description: `You have only ${analytics.seniorityLevels.executive} executive-level connections. Building relationships with senior leaders can unlock significant opportunities.`,
        actionItems: [
          'Attend industry conferences and leadership events',
          'Request introductions to executives through existing connections',
          'Engage with executive content on LinkedIn',
          'Consider joining executive networking groups'
        ],
        data: { currentExecutives: analytics.seniorityLevels.executive }
      });
    }

    // Industry diversity gap
    if (analytics.industryDiversity < 30 && analytics.totalConnections > 15) {
      insights.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Diversify Industry Connections',
        description: `Your network is concentrated in few industries (${analytics.industryDiversity.toFixed(1)}% diversity). Expanding across industries can create unexpected opportunities.`,
        actionItems: [
          'Join cross-industry professional meetups',
          'Attend startup and innovation events',
          'Connect with professionals in adjacent industries',
          'Participate in industry association events'
        ],
        data: { diversityScore: analytics.industryDiversity }
      });
    }

    return insights;
  }

  private async identifyStrengthOpportunities(analytics: NetworkAnalytics): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];

    // Strong connection leverage
    if (analytics.strongConnections > 5) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: 'Leverage Strong Connections',
        description: `You have ${analytics.strongConnections} strong connections. These are your best advocates for warm introductions.`,
        actionItems: [
          'Schedule catch-up calls with your strongest connections',
          'Ask for specific introductions to their valuable contacts',
          'Offer mutual value through your own network',
          'Keep strong connections updated on your goals'
        ],
        data: { strongConnections: analytics.strongConnections }
      });
    }

    // Relationship strengthening
    const weakConnections = analytics.totalConnections - analytics.strongConnections;
    if (weakConnections > 10) {
      insights.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Strengthen Existing Relationships',
        description: `You have ${weakConnections} connections that could be strengthened. Converting weak ties to strong ones multiplies their value.`,
        actionItems: [
          'Reach out to dormant connections with value-add messages',
          'Share relevant opportunities with your network',
          'Comment meaningfully on their social media updates',
          'Invite connections for coffee or virtual meetings'
        ],
        data: { weakConnections }
      });
    }

    return insights;
  }

  private async suggestStrategicConnections(analytics: NetworkAnalytics): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];

    // Company-specific opportunities
    const topCompanies = analytics.companyDistribution.slice(0, 3);
    if (topCompanies.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'Expand Within Key Companies',
        description: `You have strong presence at ${topCompanies[0].company} (${topCompanies[0].count} connections). Expand your network within this organization for maximum leverage.`,
        actionItems: [
          `Connect with more professionals at ${topCompanies[0].company}`,
          'Ask current connections for internal introductions',
          'Attend company-sponsored events or webinars',
          'Engage with company content and initiatives'
        ],
        data: { topCompany: topCompanies[0] }
      });
    }

    return insights;
  }

  private async analyzeNetworkHealth(analytics: NetworkAnalytics): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];

    // Network size assessment
    if (analytics.totalConnections < 50) {
      insights.push({
        type: 'strategy',
        priority: 'high',
        title: 'Grow Network Foundation',
        description: `Your network of ${analytics.totalConnections} connections is growing. Aim for 100+ quality connections to unlock networking benefits.`,
        actionItems: [
          'Set a goal to make 2-3 new connections per week',
          'Reconnect with former colleagues and classmates',
          'Join professional associations in your field',
          'Attend networking events regularly'
        ],
        data: { currentSize: analytics.totalConnections, targetSize: 100 }
      });
    } else if (analytics.totalConnections > 200) {
      insights.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Focus on Quality Over Quantity',
        description: `With ${analytics.totalConnections} connections, focus on deepening relationships rather than adding more contacts.`,
        actionItems: [
          'Audit your network and identify top 50 priority contacts',
          'Schedule regular check-ins with key connections',
          'Provide value before asking for favors',
          'Organize small networking gatherings'
        ],
        data: { networkSize: analytics.totalConnections }
      });
    }

    return insights;
  }

  private async recommendTimingStrategies(): Promise<NetworkingInsight[]> {
    const insights: NetworkingInsight[] = [];

    // Seasonal timing recommendations
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov
      insights.push({
        type: 'timing',
        priority: 'medium',
        title: 'Q4 Networking Strategy',
        description: 'Q4 is ideal for relationship building as professionals plan for the new year. People are more open to strategic conversations.',
        actionItems: [
          'Schedule year-end coffee meetings with key contacts',
          'Share your goals for the upcoming year',
          'Attend holiday networking events',
          'Send thoughtful year-end messages to your network'
        ]
      });
    }

    return insights;
  }

  private generateMockGrowthTrend(): Array<{ month: string; connections: number; quality: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      connections: 15 + index * 8 + Math.floor(Math.random() * 10),
      quality: 65 + index * 5 + Math.floor(Math.random() * 15)
    }));
  }

  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  async getNetworkStrengthAnalysis(userId: string = 'user-1'): Promise<{
    overallStrength: number;
    strengthFactors: Array<{
      factor: string;
      score: number;
      impact: string;
      recommendation: string;
    }>;
    benchmarks: {
      yourNetwork: number;
      industryAverage: number;
      topPerformers: number;
    };
  }> {
    const analytics = await this.getNetworkAnalytics(userId);
    
    // Calculate overall network strength (0-100)
    const factors = [
      {
        factor: 'Network Size',
        score: Math.min(100, (analytics.totalConnections / 150) * 100),
        impact: analytics.totalConnections > 100 ? 'positive' : 'needs_improvement',
        recommendation: analytics.totalConnections < 100 
          ? 'Expand your network to 100+ quality connections'
          : 'Maintain and nurture your existing network'
      },
      {
        factor: 'Relationship Quality',
        score: (analytics.strongConnections / Math.max(analytics.totalConnections, 1)) * 100,
        impact: analytics.strongConnections > analytics.totalConnections * 0.3 ? 'positive' : 'needs_improvement',
        recommendation: 'Focus on deepening relationships with existing connections'
      },
      {
        factor: 'Industry Diversity',
        score: analytics.industryDiversity,
        impact: analytics.industryDiversity > 40 ? 'positive' : 'needs_improvement',
        recommendation: 'Connect with professionals across multiple industries'
      },
      {
        factor: 'Executive Access',
        score: Math.min(100, (analytics.seniorityLevels.executive / Math.max(analytics.totalConnections, 1)) * 500),
        impact: analytics.seniorityLevels.executive > 3 ? 'positive' : 'needs_improvement',
        recommendation: 'Build relationships with senior leaders and executives'
      }
    ];

    const overallStrength = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;

    return {
      overallStrength: Math.round(overallStrength),
      strengthFactors: factors,
      benchmarks: {
        yourNetwork: Math.round(overallStrength),
        industryAverage: 65,
        topPerformers: 85
      }
    };
  }
}

export const networkingInsightsService = new NetworkingInsightsService();