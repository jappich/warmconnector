import { MongoClient, Db, Collection } from 'mongodb';
import logger from '../utils/logger';

// Types for analytics data structures
interface NetworkOverview {
  totalPersons: number;
  totalRelationships: number;
  averageConnectionsPerPerson: string;
  networkDensity: string;
}

interface CompanyStatistic {
  _id: string;
  count: number;
  percentage: number;
}

interface DepartmentStatistic {
  _id: string;
  count: number;
  averageConnections: number;
}

interface RelationshipTypeDistribution {
  _id: string;
  count: number;
  percentage: number;
}

interface TopConnector {
  _id: string;
  name: string;
  company: string;
  connectionCount: number;
}

interface StrengthDistribution {
  _id: string;
  count: number;
  percentage: number;
}

interface TrendingConnection {
  _id: string;
  fromPerson: string;
  toPerson: string;
  strength: number;
  createdAt: Date;
}

interface EmergingDepartment {
  _id: string;
  recentAdditions: number;
}

interface AnalyticsResult {
  overview: NetworkOverview;
  companies: CompanyStatistic[];
  departments: DepartmentStatistic[];
  relationshipTypes: RelationshipTypeDistribution[];
  topConnectors: TopConnector[];
  strengthDistribution: StrengthDistribution[];
  trends?: {
    recentConnections: TrendingConnection[];
    emergingDepartments: EmergingDepartment[];
  };
}

class AnalyticsService {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private connectionRetries = 0;
  private maxRetries = 3;
  private retryDelay = 2000;

  async connectDB(): Promise<void> {
    if (this.mongoClient && this.db) {
      return; // Already connected
    }

    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MongoDB URI not configured');
      }

      this.mongoClient = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });

      await this.mongoClient.connect();
      this.db = this.mongoClient.db('warmconnector');
      
      logger.info('Analytics service connected to MongoDB');
      this.connectionRetries = 0;

    } catch (error) {
      logger.error(`MongoDB connection failed (attempt ${this.connectionRetries + 1}):`, error);
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connectDB(), this.retryDelay);
      } else {
        throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
      }
    }
  }

  private ensureDB(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connectDB() first.');
    }
    return this.db;
  }

  /**
   * Get comprehensive network analytics
   */
  async getNetworkAnalytics(): Promise<AnalyticsResult> {
    await this.connectDB();
    const db = this.ensureDB();

    try {
      logger.time('network-analytics');
      
      const [
        totalPersons,
        totalRelationships,
        companyStats,
        departmentStats,
        relationshipTypes,
        topConnectors,
        strengthDistribution
      ] = await Promise.all([
        db.collection('persons').countDocuments(),
        db.collection('relationships').countDocuments(),
        this.getCompanyStatistics(),
        this.getDepartmentStatistics(),
        this.getRelationshipTypeDistribution(),
        this.getTopConnectors(),
        this.getRelationshipStrengthDistribution()
      ]);

      const result: AnalyticsResult = {
        overview: {
          totalPersons,
          totalRelationships,
          averageConnectionsPerPerson: totalPersons > 0 ? (totalRelationships * 2 / totalPersons).toFixed(1) : '0',
          networkDensity: this.calculateNetworkDensity(totalPersons, totalRelationships)
        },
        companies: companyStats,
        departments: departmentStats,
        relationshipTypes,
        topConnectors,
        strengthDistribution
      };

      logger.timeEnd('network-analytics');
      logger.info('Network analytics generated successfully', { 
        totalPersons, 
        totalRelationships 
      });

      return result;

    } catch (error) {
      logger.error('Failed to generate network analytics:', error);
      throw new Error(`Analytics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get company distribution statistics
   */
  async getCompanyStatistics(): Promise<CompanyStatistic[]> {
    const db = this.ensureDB();

    try {
      const totalPersons = await db.collection('persons').countDocuments();
      
      const stats = await db.collection('persons').aggregate([
        {
          $match: { company: { $exists: true, $ne: null } }
        },
        {
          $group: {
            _id: '$company',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      return stats.map(stat => ({
        _id: stat._id,
        count: stat.count,
        percentage: totalPersons > 0 ? parseFloat(((stat.count / totalPersons) * 100).toFixed(1)) : 0
      }));

    } catch (error) {
      logger.error('Failed to get company statistics:', error);
      return [];
    }
  }

  /**
   * Get department distribution statistics
   */
  async getDepartmentStatistics(): Promise<DepartmentStatistic[]> {
    const db = this.ensureDB();

    try {
      const stats = await db.collection('persons').aggregate([
        {
          $match: { department: { $exists: true, $ne: null } }
        },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            averageConnections: { $avg: '$connectionCount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]).toArray();

      return stats.map(stat => ({
        _id: stat._id,
        count: stat.count,
        averageConnections: parseFloat((stat.averageConnections || 0).toFixed(1))
      }));

    } catch (error) {
      logger.error('Failed to get department statistics:', error);
      return [];
    }
  }

  /**
   * Get relationship type distribution
   */
  async getRelationshipTypeDistribution(): Promise<RelationshipTypeDistribution[]> {
    const db = this.ensureDB();

    try {
      const totalRelationships = await db.collection('relationships').countDocuments();
      
      const distribution = await db.collection('relationships').aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();

      return distribution.map(item => ({
        _id: item._id || 'Unknown',
        count: item.count,
        percentage: totalRelationships > 0 ? parseFloat(((item.count / totalRelationships) * 100).toFixed(1)) : 0
      }));

    } catch (error) {
      logger.error('Failed to get relationship type distribution:', error);
      return [];
    }
  }

  /**
   * Get top connectors in the network
   */
  async getTopConnectors(): Promise<TopConnector[]> {
    const db = this.ensureDB();

    try {
      const connectors = await db.collection('relationships').aggregate([
        {
          $group: {
            _id: '$fromPersonId',
            connectionCount: { $sum: 1 }
          }
        },
        { $sort: { connectionCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'persons',
            localField: '_id',
            foreignField: '_id',
            as: 'personData'
          }
        },
        {
          $match: { 'personData.0': { $exists: true } }
        },
        {
          $project: {
            _id: 1,
            connectionCount: 1,
            name: { $arrayElemAt: ['$personData.name', 0] },
            company: { $arrayElemAt: ['$personData.company', 0] }
          }
        }
      ]).toArray();

      return connectors.map(connector => ({
        _id: connector._id,
        name: connector.name || 'Unknown',
        company: connector.company || 'Unknown',
        connectionCount: connector.connectionCount
      }));

    } catch (error) {
      logger.error('Failed to get top connectors:', error);
      return [];
    }
  }

  /**
   * Get relationship strength distribution
   */
  async getRelationshipStrengthDistribution(): Promise<StrengthDistribution[]> {
    const db = this.ensureDB();

    try {
      const totalRelationships = await db.collection('relationships').countDocuments();
      
      const distribution = await db.collection('relationships').aggregate([
        {
          $bucket: {
            groupBy: '$strength',
            boundaries: [0, 20, 40, 60, 80, 100],
            default: 'other',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]).toArray();

      const strengthLabels = {
        0: 'Very Weak (0-19)',
        20: 'Weak (20-39)',
        40: 'Medium (40-59)',
        60: 'Strong (60-79)',
        80: 'Very Strong (80-100)',
        'other': 'Unknown'
      };

      return distribution.map(item => ({
        _id: strengthLabels[item._id] || `${item._id}+`,
        count: item.count,
        percentage: totalRelationships > 0 ? parseFloat(((item.count / totalRelationships) * 100).toFixed(1)) : 0
      }));

    } catch (error) {
      logger.error('Failed to get relationship strength distribution:', error);
      return [];
    }
  }

  /**
   * Get trending activities and insights
   */
  async getTrendingActivities(): Promise<{ recentConnections: TrendingConnection[]; emergingDepartments: EmergingDepartment[] }> {
    try {
      const [recentConnections, emergingDepartments] = await Promise.all([
        this.getRecentConnections(),
        this.getEmergingDepartments()
      ]);

      return {
        recentConnections,
        emergingDepartments
      };

    } catch (error) {
      logger.error('Failed to get trending activities:', error);
      return { recentConnections: [], emergingDepartments: [] };
    }
  }

  /**
   * Get recent high-value connections
   */
  async getRecentConnections(): Promise<TrendingConnection[]> {
    const db = this.ensureDB();

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return await db.collection('relationships').aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            strength: { $gte: 50 }
          }
        },
        { $sort: { strength: -1, createdAt: -1 } },
        { $limit: 10 }
      ]).toArray();

    } catch (error) {
      logger.error('Failed to get recent connections:', error);
      return [];
    }
  }

  /**
   * Get emerging departments with recent growth
   */
  async getEmergingDepartments(): Promise<EmergingDepartment[]> {
    const db = this.ensureDB();

    try {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      return await db.collection('persons').aggregate([
        {
          $match: { 
            department: { $exists: true, $ne: null },
            createdAt: { $gte: oneMonthAgo }
          }
        },
        {
          $group: {
            _id: '$department',
            recentAdditions: { $sum: 1 }
          }
        },
        { $sort: { recentAdditions: -1 } },
        { $limit: 5 }
      ]).toArray();

    } catch (error) {
      logger.error('Failed to get emerging departments:', error);
      return [];
    }
  }

  /**
   * Calculate network density
   */
  calculateNetworkDensity(nodes: number, edges: number): string {
    if (nodes <= 1) return '0.00';
    const maxPossibleEdges = (nodes * (nodes - 1)) / 2;
    return ((edges / maxPossibleEdges) * 100).toFixed(2);
  }

  /**
   * Get analytics for a specific company
   */
  async getCompanyAnalytics(companyName: string): Promise<any> {
    const db = this.ensureDB();

    try {
      const [
        employeeCount,
        departmentBreakdown,
        connectionStats,
        topConnectors
      ] = await Promise.all([
        db.collection('persons').countDocuments({ company: companyName }),
        db.collection('persons').aggregate([
          { $match: { company: companyName } },
          {
            $group: {
              _id: '$department',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]).toArray(),
        db.collection('relationships').aggregate([
          {
            $lookup: {
              from: 'persons',
              localField: 'fromPersonId',
              foreignField: '_id',
              as: 'fromPerson'
            }
          },
          {
            $match: { 'fromPerson.company': companyName }
          },
          {
            $group: {
              _id: null,
              totalConnections: { $sum: 1 },
              averageStrength: { $avg: '$strength' }
            }
          }
        ]).toArray(),
        this.getTopConnectors()
      ]);

      return {
        company: companyName,
        employeeCount,
        departmentBreakdown,
        connectionStats: connectionStats[0] || { totalConnections: 0, averageStrength: 0 },
        topConnectors: topConnectors.filter(c => c.company === companyName)
      };

    } catch (error) {
      logger.error(`Failed to get analytics for company ${companyName}:`, error);
      throw new Error(`Company analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get health status of the analytics service
   */
  getServiceHealth(): { status: string; connections: { mongodb: string } } {
    return {
      status: this.mongoClient && this.db ? 'healthy' : 'disconnected',
      connections: {
        mongodb: this.mongoClient && this.db ? 'connected' : 'disconnected'
      }
    };
  }

  /**
   * Close MongoDB connection
   */
  async close(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
        this.db = null;
        logger.info('Analytics service MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
export { AnalyticsService, type AnalyticsResult, type NetworkOverview, type CompanyStatistic };