import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Logger, createLogger } from '../utils/logger';

const logger = createLogger('RealTimeSync');

// TypeScript interfaces for real-time sync
export interface DatabaseChange {
  id: string;
  collection: string;
  operation: 'insert' | 'update' | 'delete';
  timestamp: Date;
  data?: any;
  previousData?: any;
}

export interface SyncMetrics {
  totalChanges: number;
  changesProcessed: number;
  errors: number;
  lastSyncTime: Date;
  averageProcessingTime: number;
  uptime: number;
}

export interface SyncStatus {
  isRunning: boolean;
  isConnected: boolean;
  lastSync: Date | null;
  totalSyncs: number;
  errors: number;
  connections: number;
}

export interface ConnectionInfo {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  type: string;
}

// Event types for type safety
export interface SyncEvents {
  'sync:initialized': () => void;
  'sync:started': () => void;
  'sync:completed': (metrics: SyncMetrics) => void;
  'sync:error': (error: Error) => void;
  'change:detected': (change: DatabaseChange) => void;
  'connection:added': (connectionInfo: ConnectionInfo) => void;
  'connection:removed': (connectionId: string) => void;
}

// MongoDB connection with proper error handling
class MongoConnection {
  private static instance: MongoConnection;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  async connect(): Promise<void> {
    if (mongoose.connections[0].readyState === 1) {
      return; // Already connected
    }

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await mongoose.connect(mongoUri, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        
        logger.info(`MongoDB connected for real-time sync service (attempt ${attempt + 1})`);
        this.connectionRetries = 0;
        return;
      } catch (error) {
        this.connectionRetries = attempt + 1;
        logger.error(`MongoDB connection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries + 1} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }
}

export class RealTimeDataSync extends EventEmitter {
  private syncInterval: NodeJS.Timeout | null = null;
  private connectionPool: Map<string, ConnectionInfo> = new Map();
  private lastSyncTimestamp: Date | null = null;
  private isConnected: boolean = false;
  private isRunning: boolean = false;
  private mongoConnection: MongoConnection;
  private startTime: Date = new Date();
  private totalSyncs: number = 0;
  private totalErrors: number = 0;
  private syncMetrics: SyncMetrics[] = [];

  constructor() {
    super();
    this.mongoConnection = MongoConnection.getInstance();
  }

  // Type-safe event emitter methods
  emit<K extends keyof SyncEvents>(event: K, ...args: Parameters<SyncEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof SyncEvents>(event: K, listener: SyncEvents[K]): this {
    return super.on(event, listener);
  }

  once<K extends keyof SyncEvents>(event: K, listener: SyncEvents[K]): this {
    return super.once(event, listener);
  }

  off<K extends keyof SyncEvents>(event: K, listener: SyncEvents[K]): this {
    return super.off(event, listener);
  }

  async initialize(): Promise<boolean> {
    try {
      await this.mongoConnection.connect();
      this.isConnected = true;
      
      logger.info('Real-time sync service initialized');
      this.emit('sync:initialized');
      
      // Start continuous sync
      this.startContinuousSync();
      
      return true;
    } catch (error) {
      logger.error('Real-time sync initialization failed:', error);
      this.emit('sync:error', error as Error);
      return false;
    }
  }

  startContinuousSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds for real-time updates
    this.syncInterval = setInterval(async () => {
      try {
        await this.performDataSync();
      } catch (error) {
        logger.error('Sync iteration failed:', error);
        this.totalErrors++;
        this.emit('sync:error', error as Error);
      }
    }, 30000);

    this.isRunning = true;
    logger.info('Continuous data sync started');
    this.emit('sync:started');
  }

  async performDataSync(): Promise<SyncMetrics> {
    const syncStartTime = new Date();
    
    try {
      // Monitor database changes since last sync
      const changeLog = await this.detectDatabaseChanges();
      
      if (changeLog.length > 0) {
        logger.info(`Processing ${changeLog.length} database changes`);
        
        // Process changes in batches to avoid overwhelming the system
        const batchSize = 10;
        let changesProcessed = 0;
        let errors = 0;

        for (let i = 0; i < changeLog.length; i += batchSize) {
          const batch = changeLog.slice(i, i + batchSize);
          
          try {
            await this.processBatch(batch);
            changesProcessed += batch.length;
          } catch (error) {
            logger.error('Batch processing failed:', error);
            errors++;
          }
        }

        // Emit individual change events
        changeLog.forEach(change => {
          this.emit('change:detected', change);
        });
      }

      const syncEndTime = new Date();
      const processingTime = syncEndTime.getTime() - syncStartTime.getTime();
      
      const metrics: SyncMetrics = {
        totalChanges: changeLog.length,
        changesProcessed: changeLog.length,
        errors: 0,
        lastSyncTime: syncEndTime,
        averageProcessingTime: processingTime,
        uptime: this.getUptime()
      };

      this.syncMetrics.push(metrics);
      // Keep only last 100 metrics
      if (this.syncMetrics.length > 100) {
        this.syncMetrics = this.syncMetrics.slice(-100);
      }

      this.lastSyncTimestamp = syncEndTime;
      this.totalSyncs++;
      
      this.emit('sync:completed', metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Data sync failed:', error);
      this.totalErrors++;
      throw error;
    }
  }

  private async detectDatabaseChanges(): Promise<DatabaseChange[]> {
    try {
      const changes: DatabaseChange[] = [];
      const cutoffTime = this.lastSyncTimestamp || new Date(Date.now() - 60000); // Last minute if no previous sync

      // Check for changes in key collections
      const collections = ['persons', 'relationships', 'companies', 'connection_requests'];
      
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db?.collection(collectionName);
          if (!collection) continue;

          // Find documents modified since last sync
          const recentChanges = await collection.find({
            $or: [
              { updatedAt: { $gt: cutoffTime } },
              { createdAt: { $gt: cutoffTime } }
            ]
          }).limit(50).toArray();

          recentChanges.forEach(doc => {
            const isNew = doc.createdAt > cutoffTime;
            changes.push({
              id: doc._id.toString(),
              collection: collectionName,
              operation: isNew ? 'insert' : 'update',
              timestamp: doc.updatedAt || doc.createdAt || new Date(),
              data: doc
            });
          });
        } catch (error) {
          logger.error(`Error checking collection ${collectionName}:`, error);
        }
      }

      return changes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      logger.error('Error detecting database changes:', error);
      return [];
    }
  }

  private async processBatch(changes: DatabaseChange[]): Promise<void> {
    // Process each change in the batch
    for (const change of changes) {
      try {
        await this.processChange(change);
      } catch (error) {
        logger.error(`Error processing change ${change.id}:`, error);
        throw error;
      }
    }
  }

  private async processChange(change: DatabaseChange): Promise<void> {
    // This is where you would implement specific business logic
    // For example: updating caches, triggering notifications, etc.
    logger.debug(`Processing ${change.operation} on ${change.collection}: ${change.id}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  addConnection(connectionId: string, type: string = 'websocket'): void {
    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      type
    };

    this.connectionPool.set(connectionId, connectionInfo);
    logger.info(`Connection added: ${connectionId} (${type})`);
    this.emit('connection:added', connectionInfo);
  }

  removeConnection(connectionId: string): void {
    if (this.connectionPool.has(connectionId)) {
      this.connectionPool.delete(connectionId);
      logger.info(`Connection removed: ${connectionId}`);
      this.emit('connection:removed', connectionId);
    }
  }

  updateConnectionActivity(connectionId: string): void {
    const connection = this.connectionPool.get(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  getConnections(): ConnectionInfo[] {
    return Array.from(this.connectionPool.values());
  }

  getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      isConnected: this.isConnected,
      lastSync: this.lastSyncTimestamp,
      totalSyncs: this.totalSyncs,
      errors: this.totalErrors,
      connections: this.connectionPool.size
    };
  }

  getMetrics(): SyncMetrics[] {
    return [...this.syncMetrics];
  }

  getAverageMetrics(): Partial<SyncMetrics> {
    if (this.syncMetrics.length === 0) {
      return {};
    }

    const totals = this.syncMetrics.reduce((acc, metric) => ({
      totalChanges: acc.totalChanges + metric.totalChanges,
      changesProcessed: acc.changesProcessed + metric.changesProcessed,
      errors: acc.errors + metric.errors,
      averageProcessingTime: acc.averageProcessingTime + metric.averageProcessingTime
    }), { totalChanges: 0, changesProcessed: 0, errors: 0, averageProcessingTime: 0 });

    const count = this.syncMetrics.length;
    return {
      totalChanges: Math.round(totals.totalChanges / count),
      changesProcessed: Math.round(totals.changesProcessed / count),
      errors: Math.round(totals.errors / count),
      averageProcessingTime: Math.round(totals.averageProcessingTime / count),
      uptime: this.getUptime()
    };
  }

  private getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    logger.info('Real-time sync stopped');
  }

  async close(): Promise<void> {
    try {
      this.stopSync();
      this.connectionPool.clear();
      
      if (this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
      }
      
      this.removeAllListeners();
      logger.info('RealTimeDataSync service closed');
    } catch (error) {
      logger.error('Error closing RealTimeDataSync service:', error);
    }
  }

  // Force a manual sync
  async forceSyncNow(): Promise<SyncMetrics> {
    logger.info('Forcing manual data sync');
    return await this.performDataSync();
  }

  // Get health status
  getHealthStatus(): {
    status: string;
    uptime: number;
    connections: number;
    lastSync: Date | null;
    totalSyncs: number;
    errorRate: number;
  } {
    const errorRate = this.totalSyncs > 0 ? (this.totalErrors / this.totalSyncs) * 100 : 0;
    
    return {
      status: this.isRunning && this.isConnected ? 'healthy' : 'unhealthy',
      uptime: this.getUptime(),
      connections: this.connectionPool.size,
      lastSync: this.lastSyncTimestamp,
      totalSyncs: this.totalSyncs,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }
}

// Export default instance
export default new RealTimeDataSync();