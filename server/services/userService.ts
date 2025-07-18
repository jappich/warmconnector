import mongoose from 'mongoose';
import logger from '../utils/logger';

// Types for better type safety
export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  company?: string;
  title?: string;
  education?: string[];
  organizations?: string[];
  family?: string[];
  hometowns?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionRequest {
  requestId: string;
  userId: string;
  targetName: string;
  targetCompany?: string;
  connectionPath: ConnectionPathNode[];
  messageTemplate: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  requestDate: Date;
  lastUpdated: Date;
  notes?: string;
}

export interface ConnectionPathNode {
  nodeId: string;
  name: string;
  company: string;
  title: string;
}

// Enhanced MongoDB Connection Management
class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnecting = false;
  private connectionRetries = 0;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    if (mongoose.connections[0].readyState === 1) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (mongoose.connections[0].readyState === 1) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection attempt failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    try {
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
      
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
      });

      logger.info('MongoDB connected successfully for user service');
      this.connectionRetries = 0;
      
      // Set up connection event handlers
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected, attempting to reconnect...');
        this.handleReconnection();
      });

    } catch (error) {
      logger.error(`MongoDB connection failed (attempt ${this.connectionRetries + 1}):`, error);
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async handleReconnection(): Promise<void> {
    if (this.connectionRetries < this.maxRetries) {
      setTimeout(() => this.connect(), this.retryDelay);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }

  getConnectionStatus(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connections[0].readyState] || 'unknown';
  }
}

// MongoDB Schemas with enhanced validation
const UserProfileSchema = new mongoose.Schema<UserProfile>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true,
    validate: {
      validator: (email: string) => /\S+@\S+\.\S+/.test(email),
      message: 'Invalid email format'
    }
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  company: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  title: { 
    type: String,
    trim: true,
    maxlength: 150
  },
  education: [{ 
    type: String,
    trim: true,
    maxlength: 200
  }],
  organizations: [{ 
    type: String,
    trim: true,
    maxlength: 100
  }],
  family: [{ 
    type: String,
    trim: true,
    maxlength: 100
  }],
  hometowns: [{ 
    type: String,
    trim: true,
    maxlength: 100
  }],
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'user_profiles'
});

const ConnectionRequestSchema = new mongoose.Schema<ConnectionRequest>({
  requestId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  targetName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  targetCompany: { 
    type: String,
    trim: true,
    maxlength: 100
  },
  connectionPath: [{
    nodeId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true }
  }],
  messageTemplate: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  requestDate: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  collection: 'connection_requests'
});

// Create indexes for better performance
UserProfileSchema.index({ email: 1, company: 1 });
UserProfileSchema.index({ createdAt: -1 });
ConnectionRequestSchema.index({ userId: 1, status: 1 });
ConnectionRequestSchema.index({ requestDate: -1 });

// Models
const UserProfileModel = mongoose.model<UserProfile>('UserProfile', UserProfileSchema);
const ConnectionRequestModel = mongoose.model<ConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);

// Enhanced UserService Class with comprehensive error handling
export class UserService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      await this.dbManager.connect();
      logger.info('UserService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize UserService:', error);
      throw error;
    }
  }

  async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      await this.dbManager.connect();

      const updateData = {
        ...profileData,
        userId,
        updatedAt: new Date()
      };

      const profile = await UserProfileModel.findOneAndUpdate(
        { userId },
        updateData,
        { 
          upsert: true, 
          new: true, 
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      logger.info(`Profile ${profile ? 'updated' : 'created'} for user ${userId}`);
      return profile!;
    } catch (error) {
      logger.error(`Failed to create/update profile for user ${userId}:`, error);
      throw new Error(`Profile operation failed: ${error.message}`);
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      await this.dbManager.connect();

      const profile = await UserProfileModel.findOne({ userId }).lean();
      
      if (profile) {
        logger.debug(`Profile retrieved for user ${userId}`);
      } else {
        logger.debug(`No profile found for user ${userId}`);
      }

      return profile;
    } catch (error) {
      logger.error(`Failed to get profile for user ${userId}:`, error);
      throw new Error(`Profile retrieval failed: ${error.message}`);
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    try {
      await this.dbManager.connect();

      const result = await UserProfileModel.deleteOne({ userId });
      
      if (result.deletedCount > 0) {
        logger.info(`Profile deleted for user ${userId}`);
        return true;
      } else {
        logger.warn(`No profile found to delete for user ${userId}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to delete profile for user ${userId}:`, error);
      throw new Error(`Profile deletion failed: ${error.message}`);
    }
  }

  async searchProfiles(searchCriteria: Partial<UserProfile>, limit = 20): Promise<UserProfile[]> {
    try {
      await this.dbManager.connect();

      const query = {};
      
      // Build search query with regex for partial matches
      if (searchCriteria.name) {
        query['name'] = { $regex: searchCriteria.name, $options: 'i' };
      }
      if (searchCriteria.company) {
        query['company'] = { $regex: searchCriteria.company, $options: 'i' };
      }
      if (searchCriteria.title) {
        query['title'] = { $regex: searchCriteria.title, $options: 'i' };
      }
      if (searchCriteria.email) {
        query['email'] = { $regex: searchCriteria.email, $options: 'i' };
      }

      const profiles = await UserProfileModel
        .find(query)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();

      logger.debug(`Found ${profiles.length} profiles matching search criteria`);
      return profiles;
    } catch (error) {
      logger.error('Failed to search profiles:', error);
      throw new Error(`Profile search failed: ${error.message}`);
    }
  }

  async saveConnectionRequest(requestData: Partial<ConnectionRequest>): Promise<ConnectionRequest> {
    try {
      await this.dbManager.connect();

      if (!requestData.requestId) {
        requestData.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const connectionRequest = new ConnectionRequestModel({
        ...requestData,
        lastUpdated: new Date()
      });

      const savedRequest = await connectionRequest.save();
      logger.info(`Connection request saved with ID: ${savedRequest.requestId}`);
      
      return savedRequest;
    } catch (error) {
      logger.error('Failed to save connection request:', error);
      throw new Error(`Connection request save failed: ${error.message}`);
    }
  }

  async getConnectionRequests(userId: string, status?: string): Promise<ConnectionRequest[]> {
    try {
      await this.dbManager.connect();

      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const requests = await ConnectionRequestModel
        .find(query)
        .sort({ requestDate: -1 })
        .lean();

      logger.debug(`Found ${requests.length} connection requests for user ${userId}`);
      return requests;
    } catch (error) {
      logger.error(`Failed to get connection requests for user ${userId}:`, error);
      throw new Error(`Connection request retrieval failed: ${error.message}`);
    }
  }

  async updateConnectionStatus(requestId: string, status: string, notes?: string): Promise<ConnectionRequest | null> {
    try {
      await this.dbManager.connect();

      const updateData: any = { 
        status, 
        lastUpdated: new Date() 
      };
      
      if (notes) {
        updateData.notes = notes;
      }

      const updatedRequest = await ConnectionRequestModel.findOneAndUpdate(
        { requestId },
        updateData,
        { new: true, runValidators: true }
      );

      if (updatedRequest) {
        logger.info(`Connection request ${requestId} status updated to ${status}`);
      } else {
        logger.warn(`Connection request ${requestId} not found for status update`);
      }

      return updatedRequest;
    } catch (error) {
      logger.error(`Failed to update connection request ${requestId}:`, error);
      throw new Error(`Connection request update failed: ${error.message}`);
    }
  }

  async getConnectionRequestStats(userId: string): Promise<any> {
    try {
      await this.dbManager.connect();

      const stats = await ConnectionRequestModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        pending: 0,
        sent: 0,
        accepted: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      logger.debug(`Connection request stats retrieved for user ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to get connection request stats for user ${userId}:`, error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.dbManager.disconnect();
      logger.info('UserService cleanup completed');
    } catch (error) {
      logger.error('UserService cleanup failed:', error);
    }
  }

  getStatus(): { connection: string; models: string[] } {
    return {
      connection: this.dbManager.getConnectionStatus(),
      models: ['UserProfile', 'ConnectionRequest']
    };
  }
}

// Create singleton instance
const userService = new UserService();

// Export both the class and instance
export default userService;
export { UserProfileModel, ConnectionRequestModel, DatabaseManager };