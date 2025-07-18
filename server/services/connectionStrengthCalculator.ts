import mongoose from 'mongoose';
import logger from '../utils/logger';

// Type definitions for connection strength calculation
interface ConnectionWeightings {
  interactions: number;
  mutualConnections: number;
  sharedHistory: number;
  connectionAge: number;
  engagement: number;
}

interface Person {
  _id: string;
  name: string;
  company?: string;
  department?: string;
  title?: string;
  education?: string[];
  hometowns?: string[];
  skills?: string[];
  createdAt?: Date;
  lastInteraction?: Date;
  responseRate?: number;
}

interface StrengthBreakdown {
  interactions: number;
  mutualConnections: number;
  sharedHistory: number;
  connectionAge: number;
  engagement: number;
}

interface ConnectionStrengthResult {
  score: number;
  category: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak' | 'Very Weak';
  breakdown: StrengthBreakdown;
  confidence: number;
  factors: string[];
  suggestions?: string[];
}

interface PersonPair {
  fromPersonId: string;
  toPersonId: string;
}

interface BatchCalculationResult extends PersonPair {
  score: number;
  category: string;
  error?: string;
}

interface StrengthStats {
  networkStats: {
    totalCalculations: number;
    averageStrength: number;
    strongConnections: number;
    moderateConnections: number;
    weakConnections: number;
  };
}

interface StrengthHistoryRecord {
  fromPersonId: string;
  toPersonId: string;
  score: number;
  breakdown: StrengthBreakdown;
  calculatedAt: Date;
  trend: number;
}

class ConnectionStrengthCalculator {
  private weightings: ConnectionWeightings;
  private isInitialized: boolean = false;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.weightings = {
      interactions: 0.30,        // Recent communication & meetings
      mutualConnections: 0.25,   // Shared professional network
      sharedHistory: 0.20,       // Company, school, background
      connectionAge: 0.15,       // Duration of relationship
      engagement: 0.10           // Response patterns & quality
    };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MongoDB connection required for strength calculation');
      }
      
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
        });
      }
      
      logger.info('Connection strength calculator initialized');
      this.isInitialized = true;
      this.connectionRetries = 0;
      return true;

    } catch (error) {
      this.connectionRetries++;
      logger.error(`Calculator initialization failed (attempt ${this.connectionRetries}):`, error);
      
      if (this.connectionRetries < this.maxRetries) {
        logger.info(`Retrying initialization in 2 seconds...`);
        setTimeout(() => this.initialize(), 2000);
        return false;
      }
      
      throw new Error(`Calculator initialization failed after ${this.maxRetries} attempts`);
    }
  }

  async calculateConnectionStrength(fromPersonId: string, toPersonId: string): Promise<ConnectionStrengthResult> {
    try {
      await this.initialize();
      
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      logger.time(`strength-calc-${fromPersonId}-${toPersonId}`);
      
      // Get person profiles from MongoDB
      const [fromPerson, toPerson] = await Promise.all([
        db.collection('persons').findOne({ _id: fromPersonId }) as Promise<Person | null>,
        db.collection('persons').findOne({ _id: toPersonId }) as Promise<Person | null>
      ]);

      if (!fromPerson || !toPerson) {
        throw new Error(`Person not found: ${!fromPerson ? fromPersonId : toPersonId}`);
      }

      // Calculate individual strength components
      const breakdown: StrengthBreakdown = {
        interactions: await this.calculateInteractionScore(fromPerson, toPerson, db),
        mutualConnections: await this.calculateMutualConnectionScore(fromPerson, toPerson, db),
        sharedHistory: await this.calculateSharedHistoryScore(fromPerson, toPerson),
        connectionAge: await this.calculateConnectionAgeScore(fromPersonId, toPersonId, db),
        engagement: await this.calculateEngagementScore(fromPerson, toPerson)
      };

      // Calculate weighted total score
      const score = Math.round(
        (breakdown.interactions * this.weightings.interactions) +
        (breakdown.mutualConnections * this.weightings.mutualConnections) +
        (breakdown.sharedHistory * this.weightings.sharedHistory) +
        (breakdown.connectionAge * this.weightings.connectionAge) +
        (breakdown.engagement * this.weightings.engagement)
      );

      const result: ConnectionStrengthResult = {
        score,
        category: this.getStrengthCategory(score),
        breakdown,
        confidence: this.calculateConfidence(breakdown),
        factors: this.identifyKeyFactors(breakdown),
        suggestions: this.generateSuggestions(breakdown, score)
      };

      // Store calculation for historical tracking
      await this.storeCalculation(fromPersonId, toPersonId, result, db);

      logger.timeEnd(`strength-calc-${fromPersonId}-${toPersonId}`);
      logger.debug('Connection strength calculated', {
        fromPersonId,
        toPersonId,
        score,
        category: result.category
      });

      return result;

    } catch (error) {
      logger.error(`Connection strength calculation failed for ${fromPersonId} -> ${toPersonId}:`, error);
      throw new Error(`Strength calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateInteractionScore(fromPerson: Person, toPerson: Person, db: any): Promise<number> {
    try {
      // Look for recent interactions between the two people
      const recentInteractions = await db.collection('interactions').countDocuments({
        $or: [
          { fromPersonId: fromPerson._id, toPersonId: toPerson._id },
          { fromPersonId: toPerson._id, toPersonId: fromPerson._id }
        ],
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      });

      // Base score on frequency and recency
      const baseScore = Math.min(recentInteractions * 15, 80);
      
      // Bonus for very recent interactions
      const veryRecentInteractions = await db.collection('interactions').countDocuments({
        $or: [
          { fromPersonId: fromPerson._id, toPersonId: toPerson._id },
          { fromPersonId: toPerson._id, toPersonId: fromPerson._id }
        ],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });

      const bonusScore = veryRecentInteractions * 5;
      return Math.min(baseScore + bonusScore, 100);

    } catch (error) {
      logger.error('Interaction score calculation failed:', error);
      return 0;
    }
  }

  private async calculateMutualConnectionScore(fromPerson: Person, toPerson: Person, db: any): Promise<number> {
    try {
      // Find mutual connections
      const fromConnections = await db.collection('relationships').distinct('toPersonId', {
        fromPersonId: fromPerson._id
      });

      const toConnections = await db.collection('relationships').distinct('toPersonId', {
        fromPersonId: toPerson._id
      });

      const mutualConnections = fromConnections.filter((id: string) => 
        toConnections.includes(id)
      );

      // Score based on number of mutual connections
      const baseScore = Math.min(mutualConnections.length * 8, 85);
      
      // Bonus for high-quality mutual connections
      const qualityConnections = await db.collection('relationships').countDocuments({
        fromPersonId: { $in: mutualConnections },
        strength: { $gte: 80 }
      });

      const bonusScore = qualityConnections * 3;
      return Math.min(baseScore + bonusScore, 100);

    } catch (error) {
      logger.error('Mutual connection score calculation failed:', error);
      return 0;
    }
  }

  private async calculateSharedHistoryScore(fromPerson: Person, toPerson: Person): Promise<number> {
    let score = 0;

    try {
      // Same company
      if (fromPerson.company && toPerson.company && fromPerson.company === toPerson.company) {
        score += 40;
        
        // Same department bonus
        if (fromPerson.department && toPerson.department && fromPerson.department === toPerson.department) {
          score += 20;
        }
      }

      // Shared education
      if (fromPerson.education && toPerson.education) {
        const sharedEducation = fromPerson.education.filter(edu => 
          toPerson.education!.some(tEdu => 
            edu.toLowerCase().includes(tEdu.toLowerCase()) || 
            tEdu.toLowerCase().includes(edu.toLowerCase())
          )
        );
        score += sharedEducation.length * 15;
      }

      // Shared hometowns
      if (fromPerson.hometowns && toPerson.hometowns) {
        const sharedHometowns = fromPerson.hometowns.filter(hometown => 
          toPerson.hometowns!.includes(hometown)
        );
        score += sharedHometowns.length * 10;
      }

      // Shared skills
      if (fromPerson.skills && toPerson.skills) {
        const sharedSkills = fromPerson.skills.filter(skill => 
          toPerson.skills!.includes(skill)
        );
        score += sharedSkills.length * 5;
      }

      return Math.min(score, 100);

    } catch (error) {
      logger.error('Shared history score calculation failed:', error);
      return 0;
    }
  }

  private async calculateConnectionAgeScore(fromPersonId: string, toPersonId: string, db: any): Promise<number> {
    try {
      // Find the oldest relationship between the two people
      const relationship = await db.collection('relationships').findOne(
        {
          $or: [
            { fromPersonId, toPersonId },
            { fromPersonId: toPersonId, toPersonId: fromPersonId }
          ]
        },
        { sort: { createdAt: 1 } }
      );

      if (!relationship || !relationship.createdAt) {
        return 0;
      }

      const ageInDays = (Date.now() - new Date(relationship.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      
      // Score increases with age, capped at 100
      if (ageInDays < 30) return Math.round(ageInDays * 2); // 0-60 for first month
      if (ageInDays < 90) return Math.round(60 + (ageInDays - 30) * 0.5); // 60-90 for 3 months
      if (ageInDays < 365) return Math.round(75 + (ageInDays - 90) * 0.1); // 75-100 for first year
      
      return 100; // Max score for relationships over a year

    } catch (error) {
      logger.error('Connection age score calculation failed:', error);
      return 0;
    }
  }

  private async calculateEngagementScore(fromPerson: Person, toPerson: Person): Promise<number> {
    try {
      let score = 0;

      // Response rate factor
      if (fromPerson.responseRate && toPerson.responseRate) {
        const avgResponseRate = (fromPerson.responseRate + toPerson.responseRate) / 2;
        score += avgResponseRate * 0.6; // Max 60 points
      }

      // Last interaction recency
      if (fromPerson.lastInteraction && toPerson.lastInteraction) {
        const daysSinceInteraction = Math.min(
          (Date.now() - new Date(fromPerson.lastInteraction).getTime()) / (1000 * 60 * 60 * 24),
          (Date.now() - new Date(toPerson.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceInteraction < 7) score += 40;
        else if (daysSinceInteraction < 30) score += 20;
        else if (daysSinceInteraction < 90) score += 10;
      }

      return Math.min(score, 100);

    } catch (error) {
      logger.error('Engagement score calculation failed:', error);
      return 0;
    }
  }

  private getStrengthCategory(score: number): ConnectionStrengthResult['category'] {
    if (score >= 90) return 'Very Strong';
    if (score >= 75) return 'Strong';
    if (score >= 50) return 'Moderate';
    if (score >= 25) return 'Weak';
    return 'Very Weak';
  }

  private calculateConfidence(breakdown: StrengthBreakdown): number {
    const nonZeroFactors = Object.values(breakdown).filter(score => score > 0).length;
    const totalPossibleFactors = Object.keys(breakdown).length;
    
    return Math.round((nonZeroFactors / totalPossibleFactors) * 100);
  }

  private identifyKeyFactors(breakdown: StrengthBreakdown): string[] {
    const factors: string[] = [];
    const threshold = 60;

    if (breakdown.interactions > threshold) factors.push('Strong recent interaction history');
    if (breakdown.mutualConnections > threshold) factors.push('Extensive mutual network');
    if (breakdown.sharedHistory > threshold) factors.push('Significant shared background');
    if (breakdown.connectionAge > threshold) factors.push('Long-standing relationship');
    if (breakdown.engagement > threshold) factors.push('High engagement patterns');

    if (factors.length === 0) {
      const highestScore = Math.max(...Object.values(breakdown));
      const highestFactor = Object.entries(breakdown).find(([_, score]) => score === highestScore)?.[0];
      
      if (highestFactor) {
        factors.push(`Primary factor: ${highestFactor.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    }

    return factors;
  }

  private generateSuggestions(breakdown: StrengthBreakdown, score: number): string[] {
    const suggestions: string[] = [];

    if (score < 50) {
      if (breakdown.interactions < 30) {
        suggestions.push('Increase direct communication and meetings');
      }
      if (breakdown.mutualConnections < 30) {
        suggestions.push('Connect through mutual colleagues');
      }
      if (breakdown.engagement < 30) {
        suggestions.push('Improve response time and engagement quality');
      }
    }

    if (breakdown.sharedHistory > 50 && breakdown.interactions < 50) {
      suggestions.push('Leverage shared background for stronger collaboration');
    }

    return suggestions;
  }

  private async storeCalculation(fromPersonId: string, toPersonId: string, result: ConnectionStrengthResult, db: any): Promise<void> {
    try {
      const record: StrengthHistoryRecord = {
        fromPersonId,
        toPersonId,
        score: result.score,
        breakdown: result.breakdown,
        calculatedAt: new Date(),
        trend: result.score // Will be updated with historical comparison later
      };

      await db.collection('connection_strength_history').insertOne(record);
      
      logger.debug('Strength calculation stored', { fromPersonId, toPersonId, score: result.score });
      
    } catch (error) {
      logger.error('Failed to store calculation:', error);
    }
  }

  async batchCalculate(personPairs: PersonPair[]): Promise<BatchCalculationResult[]> {
    logger.info(`Starting batch calculation for ${personPairs.length} pairs`);
    logger.time('batch-calculation');
    
    const results: BatchCalculationResult[] = [];
    
    for (const pair of personPairs) {
      try {
        const result = await this.calculateConnectionStrength(pair.fromPersonId, pair.toPersonId);
        results.push({
          fromPersonId: pair.fromPersonId,
          toPersonId: pair.toPersonId,
          score: result.score,
          category: result.category
        });
      } catch (error) {
        logger.error(`Batch calculation failed for ${pair.fromPersonId} -> ${pair.toPersonId}:`, error);
        results.push({
          fromPersonId: pair.fromPersonId,
          toPersonId: pair.toPersonId,
          score: 0,
          category: 'Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    logger.timeEnd('batch-calculation');
    logger.info(`Batch calculation completed: ${results.length} results, ${results.filter(r => !r.error).length} successful`);
    
    return results;
  }

  async getStrengthStats(): Promise<StrengthStats> {
    try {
      await this.initialize();
      const db = mongoose.connection.db;
      
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      const stats = await db.collection('connection_strength_history').aggregate([
        {
          $group: {
            _id: null,
            totalCalculations: { $sum: 1 },
            averageStrength: { $avg: '$score' },
            strongConnections: {
              $sum: { $cond: [{ $gte: ['$score', 80] }, 1, 0] }
            },
            moderateConnections: {
              $sum: { $cond: [{ $and: [{ $gte: ['$score', 60] }, { $lt: ['$score', 80] }] }, 1, 0] }
            },
            weakConnections: {
              $sum: { $cond: [{ $lt: ['$score', 60] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      const result: StrengthStats = {
        networkStats: stats.length > 0 ? {
          totalCalculations: stats[0].totalCalculations,
          averageStrength: Math.round(stats[0].averageStrength * 100) / 100,
          strongConnections: stats[0].strongConnections,
          moderateConnections: stats[0].moderateConnections,
          weakConnections: stats[0].weakConnections
        } : {
          totalCalculations: 0,
          averageStrength: 0,
          strongConnections: 0,
          moderateConnections: 0,
          weakConnections: 0
        }
      };

      logger.info('Strength statistics retrieved', result.networkStats);
      return result;
      
    } catch (error) {
      logger.error('Failed to get strength stats:', error);
      return {
        networkStats: {
          totalCalculations: 0,
          averageStrength: 0,
          strongConnections: 0,
          moderateConnections: 0,
          weakConnections: 0
        }
      };
    }
  }

  getStatus(): { initialized: boolean; weightings: ConnectionWeightings } {
    return {
      initialized: this.isInitialized,
      weightings: this.weightings
    };
  }

  async close(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        this.isInitialized = false;
        logger.info('Connection strength calculator disconnected');
      }
    } catch (error) {
      logger.error('Error closing connection strength calculator:', error);
    }
  }
}

// Export both class and singleton instance
const connectionStrengthCalculator = new ConnectionStrengthCalculator();
export default ConnectionStrengthCalculator;
export { connectionStrengthCalculator, type ConnectionStrengthResult, type StrengthBreakdown, type PersonPair };