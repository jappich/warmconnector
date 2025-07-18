import mongoose from 'mongoose';
import { Logger, createLogger } from '../utils/logger';

const logger = createLogger('DataIngestionService');

// MongoDB connection with proper error handling and retry logic
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
        
        logger.info(`MongoDB connected for data ingestion service (attempt ${attempt + 1})`);
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

// TypeScript interfaces for data structures
export interface EmployeeProfileData {
  education?: string[];
  previousCompanies?: string[];
  skills?: string[];
  certifications?: string[];
}

export interface EmployeeRecord {
  employeeId: string;
  name: string;
  email: string;
  company: string;
  title?: string;
  department?: string;
  location?: string;
  profileData?: EmployeeProfileData;
  connectionStrength?: number;
  lastUpdated?: Date;
  importSource?: string;
}

export interface RelationshipMetadata {
  company?: string;
  timeframe?: string;
  details?: string;
  verified?: boolean;
}

export interface RelationshipRecord {
  relationshipId: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipType: 'COLLEAGUE' | 'MANAGER' | 'DIRECT_REPORT' | 'ALUMNI' | 'INDUSTRY_PEER' | 'FAMILY' | 'FRIEND';
  strength: number;
  metadata?: RelationshipMetadata;
  createdAt?: Date;
}

export interface PathNode {
  currentPersonId: string;
  path: string[];
  relationships: Array<{
    type: string;
    strength: number;
    metadata?: RelationshipMetadata;
  }>;
  totalStrength: number;
  hops: number;
}

export interface ImportResults {
  imported: number;
  updated: number;
  errors: string[];
}

export interface PersonDetails {
  employeeId: string;
  name: string;
  company: string;
  title?: string;
  department?: string;
}

// MongoDB Schemas
const CompanyEmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String },
  department: { type: String },
  location: { type: String },
  profileData: {
    education: [String],
    previousCompanies: [String],
    skills: [String],
    certifications: [String]
  },
  connectionStrength: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now },
  importSource: { type: String, default: 'manual' }
});

const RelationshipSchema = new mongoose.Schema({
  relationshipId: { type: String, required: true, unique: true },
  fromPersonId: { type: String, required: true },
  toPersonId: { type: String, required: true },
  relationshipType: { 
    type: String, 
    enum: ['COLLEAGUE', 'MANAGER', 'DIRECT_REPORT', 'ALUMNI', 'INDUSTRY_PEER', 'FAMILY', 'FRIEND'],
    required: true
  },
  strength: { type: Number, min: 1, max: 10, default: 5 },
  metadata: {
    company: String,
    timeframe: String,
    details: String,
    verified: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

const CompanyEmployee = mongoose.model('CompanyEmployee', CompanyEmployeeSchema);
const Relationship = mongoose.model('Relationship', RelationshipSchema);

export class DataIngestionService {
  private mongoConnection: MongoConnection;
  private isInitialized: boolean = false;

  constructor() {
    this.mongoConnection = MongoConnection.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.mongoConnection.connect();
      this.isInitialized = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize DataIngestionService:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('DataIngestionService not initialized. Call initialize() first.');
    }
  }

  /**
   * Import company directory data from various sources
   */
  async importCompanyDirectory(companyName: string, employeeData: any[], source: string = 'manual'): Promise<ImportResults> {
    this.ensureInitialized();

    try {
      const importResults: ImportResults = {
        imported: 0,
        updated: 0,
        errors: []
      };

      for (const employee of employeeData) {
        try {
          const employeeRecord: EmployeeRecord = {
            employeeId: employee.id || `${companyName}-${employee.email}`,
            name: employee.name,
            email: employee.email,
            company: companyName,
            title: employee.title,
            department: employee.department,
            location: employee.location,
            profileData: {
              education: employee.education || [],
              previousCompanies: employee.previousCompanies || [],
              skills: employee.skills || [],
              certifications: employee.certifications || []
            },
            connectionStrength: employee.connectionStrength || 1,
            importSource: source,
            lastUpdated: new Date()
          };

          const existing = await CompanyEmployee.findOne({ employeeId: employeeRecord.employeeId });
          
          if (existing) {
            await CompanyEmployee.findOneAndUpdate(
              { employeeId: employeeRecord.employeeId },
              employeeRecord
            );
            importResults.updated++;
          } else {
            await new CompanyEmployee(employeeRecord).save();
            importResults.imported++;
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          importResults.errors.push(`Error processing ${employee.name}: ${errorMessage}`);
          logger.error(`Error processing employee ${employee.name}:`, error);
        }
      }

      // Auto-generate relationships for same company employees
      await this.generateCompanyRelationships(companyName);

      logger.info(`Company directory import completed for ${companyName}:`, importResults);
      return importResults;
    } catch (error) {
      logger.error('Company directory import error:', error);
      throw new Error('Failed to import company directory');
    }
  }

  /**
   * Generate automatic relationships between employees of the same company
   */
  private async generateCompanyRelationships(companyName: string): Promise<void> {
    try {
      const employees = await CompanyEmployee.find({ company: companyName });
      const relationshipsToCreate: RelationshipRecord[] = [];

      for (let i = 0; i < employees.length; i++) {
        for (let j = i + 1; j < employees.length; j++) {
          const emp1 = employees[i];
          const emp2 = employees[j];

          // Skip if relationship already exists
          const existingRelationship = await Relationship.findOne({
            $or: [
              { fromPersonId: emp1.employeeId, toPersonId: emp2.employeeId },
              { fromPersonId: emp2.employeeId, toPersonId: emp1.employeeId }
            ]
          });

          if (!existingRelationship) {
            const relationshipType = this.determineRelationshipType(emp1, emp2);
            const strength = this.calculateRelationshipStrength(emp1, emp2);

            relationshipsToCreate.push({
              relationshipId: `${emp1.employeeId}-${emp2.employeeId}-${Date.now()}`,
              fromPersonId: emp1.employeeId,
              toPersonId: emp2.employeeId,
              relationshipType,
              strength,
              metadata: {
                company: companyName,
                timeframe: 'current',
                details: `Auto-generated colleague relationship`,
                verified: false
              },
              createdAt: new Date()
            });
          }
        }
      }

      if (relationshipsToCreate.length > 0) {
        await Relationship.insertMany(relationshipsToCreate);
        logger.info(`Generated ${relationshipsToCreate.length} relationships for ${companyName}`);
      }
    } catch (error) {
      logger.error('Error generating company relationships:', error);
    }
  }

  /**
   * Determine relationship type between two employees
   */
  private determineRelationshipType(emp1: any, emp2: any): RelationshipRecord['relationshipType'] {
    // Simple logic - can be enhanced with more sophisticated rules
    if (emp1.department === emp2.department) {
      return 'COLLEAGUE';
    }
    return 'INDUSTRY_PEER';
  }

  /**
   * Calculate relationship strength between two employees
   */
  private calculateRelationshipStrength(emp1: any, emp2: any): number {
    let strength = 3; // Base strength for colleagues

    // Same department = stronger connection
    if (emp1.department === emp2.department) {
      strength += 2;
    }

    // Same location = stronger connection
    if (emp1.location === emp2.location) {
      strength += 1;
    }

    // Similar skills = stronger connection
    const sharedSkills = emp1.profileData?.skills?.filter((skill: string) => 
      emp2.profileData?.skills?.includes(skill)
    )?.length || 0;
    
    strength += Math.min(sharedSkills, 2);

    return Math.min(strength, 10); // Cap at 10
  }

  /**
   * Find connection paths between two people using breadth-first search
   */
  async findConnectionPaths(fromPersonId: string, toPersonId: string, maxHops: number = 3): Promise<PathNode[]> {
    this.ensureInitialized();

    try {
      const visited = new Set<string>();
      const queue: PathNode[] = [{
        currentPersonId: fromPersonId,
        path: [fromPersonId],
        relationships: [],
        totalStrength: 0,
        hops: 0
      }];
      const paths: PathNode[] = [];

      while (queue.length > 0 && paths.length < 10) {
        const current = queue.shift()!;

        if (current.hops >= maxHops) continue;
        if (visited.has(current.currentPersonId)) continue;

        visited.add(current.currentPersonId);

        if (current.currentPersonId === toPersonId && current.hops > 0) {
          paths.push({
            ...current,
            hops: current.path.length - 1
          });
          continue;
        }

        // Find all relationships from current person
        const relationships = await Relationship.find({
          $or: [
            { fromPersonId: current.currentPersonId },
            { toPersonId: current.currentPersonId }
          ]
        });

        for (const rel of relationships) {
          const nextPersonId = rel.fromPersonId === current.currentPersonId 
            ? rel.toPersonId 
            : rel.fromPersonId;
          
          if (!current.path.includes(nextPersonId)) {
            queue.push({
              currentPersonId: nextPersonId,
              path: [...current.path, nextPersonId],
              relationships: [...current.relationships, {
                type: rel.relationshipType,
                strength: rel.strength,
                metadata: rel.metadata
              }],
              totalStrength: current.totalStrength + rel.strength,
              hops: current.hops + 1
            });
          }
        }
      }

      return paths.sort((a, b) => {
        if (a.hops !== b.hops) return a.hops - b.hops;
        return b.totalStrength - a.totalStrength;
      });
    } catch (error) {
      logger.error('Path finding error:', error);
      return [];
    }
  }

  /**
   * Get detailed information for a list of person IDs
   */
  async getPersonDetails(personIds: string[]): Promise<PersonDetails[]> {
    this.ensureInitialized();

    try {
      const persons = await CompanyEmployee.find({ 
        employeeId: { $in: personIds }
      });

      return persons.map(person => ({
        employeeId: person.employeeId,
        name: person.name,
        company: person.company,
        title: person.title,
        department: person.department
      }));
    } catch (error) {
      logger.error('Error fetching person details:', error);
      return [];
    }
  }

  /**
   * Search for people by name or company
   */
  async searchPeople(query: string, limit: number = 20): Promise<PersonDetails[]> {
    this.ensureInitialized();

    try {
      const searchResults = await CompanyEmployee.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { company: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } }
        ]
      }).limit(limit);

      return searchResults.map(person => ({
        employeeId: person.employeeId,
        name: person.name,
        company: person.company,
        title: person.title,
        department: person.department
      }));
    } catch (error) {
      logger.error('Error searching people:', error);
      return [];
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(): { status: string; connections: { mongodb: string } } {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      connections: {
        mongodb: mongoose.connections[0].readyState === 1 ? 'connected' : 'disconnected'
      }
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      await mongoose.connection.close();
      this.isInitialized = false;
      logger.info('DataIngestionService connections closed');
    } catch (error) {
      logger.error('Error closing DataIngestionService connections:', error);
    }
  }
}

// Export default instance
export default new DataIngestionService();