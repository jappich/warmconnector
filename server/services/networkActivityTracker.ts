import mongoose from 'mongoose';
import EventEmitter from 'events';
import logger from '../utils/logger';

// Type definitions for network activity tracking
interface NetworkActivity {
  type: 'connection_created' | 'strength_update' | 'profile_updated' | 'interaction' | 'system_event';
  message: string;
  personIds: string[];
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  source?: string;
}

interface StrengthCalculation {
  fromPersonId: string;
  toPersonId: string;
  score: number;
  calculatedAt: Date;
  previousScore?: number;
}

interface ActivitySummary {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  recentActivities: NetworkActivity[];
  topActivePersons: Array<{
    personId: string;
    name?: string;
    activityCount: number;
  }>;
  strengthUpdates: {
    total: number;
    increased: number;
    decreased: number;
    averageChange: number;
  };
}

interface MonitoringStats {
  isTracking: boolean;
  uptime: number;
  activitiesProcessed: number;
  bufferSize: number;
  cacheSize: number;
  lastActivity?: Date;
  errors: number;
}

class NetworkActivityTracker extends EventEmitter {
  private activityBuffer: NetworkActivity[] = [];
  private connectionStrengthCache: Map<string, number> = new Map();
  private isTracking: boolean = false;
  private startTime: Date = new Date();
  private activitiesProcessed: number = 0;
  private errorCount: number = 0;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;
  
  // Monitoring intervals
  private activityMonitorInterval?: NodeJS.Timeout;
  private strengthUpdateInterval?: NodeJS.Timeout;
  private bufferFlushInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.setMaxListeners(20); // Increase listener limit for multiple subscriptions
  }

  async initialize(): Promise<boolean> {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MongoDB connection required for activity tracking');
      }

      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
        });
      }

      this.isTracking = true;
      this.startTime = new Date();
      this.connectionRetries = 0;
      
      logger.info('Network activity tracker initialized');
      this.emit('tracker:initialized');
      
      // Start monitoring network changes
      this.startActivityMonitoring();
      
      return true;

    } catch (error) {
      this.connectionRetries++;
      this.errorCount++;
      logger.error(`Activity tracker initialization failed (attempt ${this.connectionRetries}):`, error);
      
      if (this.connectionRetries < this.maxRetries) {
        logger.info(`Retrying initialization in 3 seconds...`);
        setTimeout(() => this.initialize(), 3000);
        return false;
      }
      
      throw new Error(`Activity tracker initialization failed after ${this.maxRetries} attempts`);
    }
  }

  private startActivityMonitoring(): void {
    // Monitor for new interactions every 30 seconds
    this.activityMonitorInterval = setInterval(async () => {
      try {
        await this.checkForNewActivity();
      } catch (error) {
        this.errorCount++;
        logger.error('Activity monitoring error:', error);
      }
    }, 30000);

    // Update connection strength cache every 5 minutes
    this.strengthUpdateInterval = setInterval(async () => {
      try {
        await this.updateStrengthCache();
      } catch (error) {
        this.errorCount++;
        logger.error('Strength cache update error:', error);
      }
    }, 300000);

    // Flush activity buffer every 2 minutes
    this.bufferFlushInterval = setInterval(async () => {
      try {
        await this.flushActivityBuffer();
      } catch (error) {
        this.errorCount++;
        logger.error('Activity buffer flush error:', error);
      }
    }, 120000);

    logger.info('Activity monitoring started with all intervals');
  }

  async addActivity(activity: Partial<NetworkActivity>): Promise<void> {
    try {
      const fullActivity: NetworkActivity = {
        type: activity.type || 'system_event',
        message: activity.message || 'Unknown activity',
        personIds: activity.personIds || [],
        timestamp: activity.timestamp || new Date(),
        priority: activity.priority || 'low',
        data: activity.data,
        source: activity.source || 'system'
      };

      this.activityBuffer.push(fullActivity);
      this.activitiesProcessed++;

      // Emit real-time event for subscribers
      this.emit('activity:new', fullActivity);

      logger.debug('Activity added', {
        type: fullActivity.type,
        personIds: fullActivity.personIds,
        priority: fullActivity.priority
      });

      // Auto-flush if buffer gets too large
      if (this.activityBuffer.length > 100) {
        await this.flushActivityBuffer();
      }

    } catch (error) {
      this.errorCount++;
      logger.error('Failed to add activity:', error);
    }
  }

  private async checkForNewActivity(): Promise<void> {
    if (!this.isTracking) return;

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Check for new relationships
      const newRelationships = await db.collection('relationships').find({
        createdAt: { $gte: fiveMinutesAgo }
      }).toArray();

      for (const relationship of newRelationships) {
        await this.addActivity({
          type: 'connection_created',
          message: `New ${relationship.type || 'professional'} connection established`,
          personIds: [relationship.fromPersonId, relationship.toPersonId],
          timestamp: relationship.createdAt,
          priority: relationship.strength > 80 ? 'high' : 'medium',
          data: {
            relationshipType: relationship.type,
            strength: relationship.strength,
            source: relationship.source
          }
        });
      }

      // Check for profile updates
      const updatedProfiles = await db.collection('persons').find({
        updatedAt: { $gte: fiveMinutesAgo }
      }).toArray();

      for (const profile of updatedProfiles) {
        await this.addActivity({
          type: 'profile_updated',
          message: `Profile updated for ${profile.name}`,
          personIds: [profile._id],
          timestamp: profile.updatedAt,
          priority: 'low',
          data: {
            company: profile.company,
            title: profile.title
          }
        });
      }

      // Check for new interactions
      const newInteractions = await db.collection('interactions').find({
        createdAt: { $gte: fiveMinutesAgo }
      }).toArray();

      for (const interaction of newInteractions) {
        await this.addActivity({
          type: 'interaction',
          message: `New interaction: ${interaction.type || 'communication'}`,
          personIds: [interaction.fromPersonId, interaction.toPersonId].filter(Boolean),
          timestamp: interaction.createdAt,
          priority: 'medium',
          data: {
            interactionType: interaction.type,
            channel: interaction.channel,
            quality: interaction.quality
          }
        });
      }

      logger.debug('Activity check completed', {
        newRelationships: newRelationships.length,
        updatedProfiles: updatedProfiles.length,
        newInteractions: newInteractions.length
      });

    } catch (error) {
      this.errorCount++;
      logger.error('Failed to check for new activity:', error);
    }
  }

  private async updateStrengthCache(): Promise<void> {
    if (!this.isTracking) return;

    const db = mongoose.connection.db;
    if (!db) return;

    try {
      // Get recent strength calculations
      const recentCalculations = await db.collection('connection_strength_history').find({
        calculatedAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // Last 6 hours
      }).sort({ calculatedAt: -1 }).toArray();

      // Check for significant strength changes
      for (const calculation of recentCalculations) {
        const cacheKey = `${calculation.fromPersonId}-${calculation.toPersonId}`;
        const previousScore = this.connectionStrengthCache.get(cacheKey);
        
        if (previousScore && Math.abs(calculation.score - previousScore) >= 5) {
          const change = calculation.score > previousScore ? 'increased' : 'decreased';
          
          await this.addActivity({
            type: 'strength_update',
            message: `Connection strength ${change} to ${calculation.score}%`,
            personIds: [calculation.fromPersonId, calculation.toPersonId],
            timestamp: calculation.calculatedAt,
            priority: calculation.score >= 80 ? 'high' : 'medium',
            data: {
              previousScore,
              newScore: calculation.score,
              change: calculation.score - previousScore,
              breakdown: calculation.breakdown
            }
          });
        }
        
        this.connectionStrengthCache.set(cacheKey, calculation.score);
      }

      logger.debug('Strength cache updated', {
        calculations: recentCalculations.length,
        cacheSize: this.connectionStrengthCache.size
      });

    } catch (error) {
      this.errorCount++;
      logger.error('Strength cache update failed:', error);
    }
  }

  private async flushActivityBuffer(): Promise<void> {
    if (this.activityBuffer.length === 0) return;

    const db = mongoose.connection.db;
    if (!db) return;

    try {
      const activitiesToFlush = [...this.activityBuffer];
      this.activityBuffer = [];

      if (activitiesToFlush.length > 0) {
        await db.collection('network_activities').insertMany(activitiesToFlush);
        
        logger.debug('Activity buffer flushed', {
          count: activitiesToFlush.length,
          types: activitiesToFlush.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });

        this.emit('buffer:flushed', {
          count: activitiesToFlush.length,
          activities: activitiesToFlush
        });
      }

    } catch (error) {
      this.errorCount++;
      logger.error('Failed to flush activity buffer:', error);
      // Restore activities to buffer if flush failed
      this.activityBuffer.unshift(...this.activityBuffer);
    }
  }

  async getActivitySummary(timeRange: number = 24): Promise<ActivitySummary> {
    if (!this.isTracking) {
      throw new Error('Activity tracker not initialized');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);

      // Get total activities and type breakdown
      const [totalActivities, activitiesByType] = await Promise.all([
        db.collection('network_activities').countDocuments({
          timestamp: { $gte: startTime }
        }),
        db.collection('network_activities').aggregate([
          { $match: { timestamp: { $gte: startTime } } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]).toArray()
      ]);

      // Get recent activities (last 50)
      const recentActivities = await db.collection('network_activities').find({
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 }).limit(50).toArray();

      // Get top active persons
      const topActivePersons = await db.collection('network_activities').aggregate([
        { $match: { timestamp: { $gte: startTime } } },
        { $unwind: '$personIds' },
        {
          $group: {
            _id: '$personIds',
            activityCount: { $sum: 1 }
          }
        },
        { $sort: { activityCount: -1 } },
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
          $project: {
            personId: '$_id',
            activityCount: 1,
            name: { $arrayElemAt: ['$personData.name', 0] }
          }
        }
      ]).toArray();

      // Get strength update statistics
      const strengthActivities = await db.collection('network_activities').find({
        type: 'strength_update',
        timestamp: { $gte: startTime }
      }).toArray();

      const strengthUpdates = {
        total: strengthActivities.length,
        increased: strengthActivities.filter(a => a.data?.change > 0).length,
        decreased: strengthActivities.filter(a => a.data?.change < 0).length,
        averageChange: strengthActivities.length > 0 
          ? strengthActivities.reduce((sum, a) => sum + (a.data?.change || 0), 0) / strengthActivities.length 
          : 0
      };

      const summary: ActivitySummary = {
        totalActivities,
        activitiesByType: activitiesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentActivities: recentActivities as NetworkActivity[],
        topActivePersons: topActivePersons.map(p => ({
          personId: p.personId,
          name: p.name,
          activityCount: p.activityCount
        })),
        strengthUpdates
      };

      logger.debug('Activity summary generated', {
        timeRange,
        totalActivities,
        uniqueTypes: Object.keys(summary.activitiesByType).length
      });

      return summary;

    } catch (error) {
      this.errorCount++;
      logger.error('Failed to generate activity summary:', error);
      throw new Error(`Activity summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPersonActivity(personId: string, limit: number = 20): Promise<NetworkActivity[]> {
    if (!this.isTracking) {
      throw new Error('Activity tracker not initialized');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      const activities = await db.collection('network_activities').find({
        personIds: personId
      }).sort({ timestamp: -1 }).limit(limit).toArray();

      logger.debug(`Retrieved ${activities.length} activities for person ${personId}`);
      return activities as NetworkActivity[];

    } catch (error) {
      this.errorCount++;
      logger.error(`Failed to get activity for person ${personId}:`, error);
      return [];
    }
  }

  getMonitoringStats(): MonitoringStats {
    const uptime = Date.now() - this.startTime.getTime();
    
    return {
      isTracking: this.isTracking,
      uptime: Math.round(uptime / 1000), // seconds
      activitiesProcessed: this.activitiesProcessed,
      bufferSize: this.activityBuffer.length,
      cacheSize: this.connectionStrengthCache.size,
      lastActivity: this.activityBuffer.length > 0 ? this.activityBuffer[this.activityBuffer.length - 1].timestamp : undefined,
      errors: this.errorCount
    };
  }

  async clearActivityHistory(olderThanDays: number = 30): Promise<number> {
    if (!this.isTracking) {
      throw new Error('Activity tracker not initialized');
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      
      const result = await db.collection('network_activities').deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info(`Cleared ${result.deletedCount} old activities older than ${olderThanDays} days`);
      return result.deletedCount;

    } catch (error) {
      this.errorCount++;
      logger.error('Failed to clear activity history:', error);
      throw new Error(`Activity history cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stop(): void {
    this.isTracking = false;

    // Clear all intervals
    if (this.activityMonitorInterval) {
      clearInterval(this.activityMonitorInterval);
    }
    if (this.strengthUpdateInterval) {
      clearInterval(this.strengthUpdateInterval);
    }
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Final buffer flush
    this.flushActivityBuffer().catch(error => {
      logger.error('Error during final buffer flush:', error);
    });

    logger.info('Network activity tracker stopped');
    this.emit('tracker:stopped');
  }

  async close(): Promise<void> {
    this.stop();

    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        logger.info('Network activity tracker disconnected from database');
      }
    } catch (error) {
      logger.error('Error closing network activity tracker:', error);
    }
  }
}

// Create and export singleton instance
const networkActivityTracker = new NetworkActivityTracker();
export default NetworkActivityTracker;
export { networkActivityTracker, type NetworkActivity, type ActivitySummary, type MonitoringStats };