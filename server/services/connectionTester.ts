import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

// TypeScript interfaces for connection testing
export interface ConnectionFactor {
  name: string;
  description: string;
  weight: number;
  testMethod: string;
}

export interface TestResult {
  factor: string;
  description: string;
  score: number;
  maxScore: number;
  percentage: number;
  details: string[];
  recommendations: string[];
}

export interface ComprehensiveTestResults {
  success: boolean;
  totalTests: number;
  averageScore: number;
  strongestFactors: string[];
  weakestFactors: string[];
  results: TestResult[];
  recommendations: string[];
  error?: string;
}

export interface PersonTestData {
  id: string;
  name: string;
  company?: string;
  department?: string;
  title?: string;
  education?: string[];
  location?: string;
  hometown?: string;
  spouse?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  interactions?: Array<{
    type: string;
    date: Date;
    description: string;
  }>;
}

export interface ConnectionPair {
  person1: PersonTestData;
  person2: PersonTestData;
  actualStrength?: number;
}

// MongoDB connection management
class MongoConnection {
  private static instance: MongoConnection;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;

  static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
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
        
        Logger.info(`MongoDB connected for connection tester (attempt ${attempt + 1})`);
        this.connectionRetries = 0;
        return;
      } catch (error) {
        this.connectionRetries = attempt + 1;
        Logger.error(`MongoDB connection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries + 1} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

export class ConnectionTester {
  private testResults: TestResult[] = [];
  private mongoConnection: MongoConnection;
  private isInitialized: boolean = false;

  private readonly connectionFactors: Record<string, ConnectionFactor> = {
    company: {
      name: 'Company Affiliation',
      description: 'Company affiliations and department matches',
      weight: 0.25,
      testMethod: 'compareCompanyData'
    },
    education: {
      name: 'Educational Background',
      description: 'Educational background and alumni networks',
      weight: 0.20,
      testMethod: 'compareEducation'
    },
    location: {
      name: 'Geographic Proximity',
      description: 'Geographic proximity and hometown data',
      weight: 0.15,
      testMethod: 'compareLocation'
    },
    spouse: {
      name: 'Family Connections',
      description: 'Spouse and family relationship connections',
      weight: 0.10,
      testMethod: 'compareFamilyConnections'
    },
    socialMedia: {
      name: 'Social Media',
      description: 'Social platform connections (LinkedIn, Twitter, Facebook)',
      weight: 0.15,
      testMethod: 'compareSocialMedia'
    },
    interactions: {
      name: 'Interaction History',
      description: 'Meeting, call, and communication history',
      weight: 0.10,
      testMethod: 'compareInteractions'
    },
    mutualConnections: {
      name: 'Mutual Connections',
      description: 'Shared professional network overlap',
      weight: 0.05,
      testMethod: 'compareMutualConnections'
    }
  };

  constructor() {
    this.mongoConnection = MongoConnection.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.mongoConnection.connect();
      this.isInitialized = true;
      Logger.info('Connection tester initialized with MongoDB');
      return true;
    } catch (error) {
      Logger.error('Tester initialization failed:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ConnectionTester not initialized. Call initialize() first.');
    }
  }

  async runComprehensiveTests(): Promise<ComprehensiveTestResults> {
    try {
      this.ensureInitialized();
      const db = mongoose.connection.db;
      
      Logger.info('Starting comprehensive connection strength tests...');
      
      // Get sample persons from MongoDB data
      const persons = await db!.collection('persons').find({}).limit(20).toArray();
      
      if (persons.length < 2) {
        return {
          success: false,
          totalTests: 0,
          averageScore: 0,
          strongestFactors: [],
          weakestFactors: [],
          results: [],
          recommendations: [],
          error: 'Insufficient person data in MongoDB for testing'
        };
      }

      const testResults: TestResult[] = [];
      
      // Test all connection factors
      for (const [factorKey, factor] of Object.entries(this.connectionFactors)) {
        const factorResults = await this.testConnectionFactor(factorKey, factor, persons, db!);
        testResults.push(factorResults);
      }

      this.testResults = testResults;

      // Calculate comprehensive results
      const averageScore = testResults.reduce((sum, result) => sum + result.percentage, 0) / testResults.length;
      
      const sortedByScore = [...testResults].sort((a, b) => b.percentage - a.percentage);
      const strongestFactors = sortedByScore.slice(0, 3).map(r => r.factor);
      const weakestFactors = sortedByScore.slice(-3).map(r => r.factor);

      const recommendations = this.generateRecommendations(testResults);

      return {
        success: true,
        totalTests: testResults.length,
        averageScore: Math.round(averageScore * 100) / 100,
        strongestFactors,
        weakestFactors,
        results: testResults,
        recommendations
      };

    } catch (error) {
      Logger.error('Comprehensive tests failed:', error);
      return {
        success: false,
        totalTests: 0,
        averageScore: 0,
        strongestFactors: [],
        weakestFactors: [],
        results: [],
        recommendations: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async testConnectionFactor(
    factorKey: string,
    factor: ConnectionFactor,
    persons: any[],
    db: mongoose.mongo.Db
  ): Promise<TestResult> {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const details: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test random pairs of people for this factor
      const testPairs = this.generateTestPairs(persons, 5);

      for (const pair of testPairs) {
        const { score, maxScore, detail } = await this.evaluateConnectionFactor(
          factorKey,
          pair.person1,
          pair.person2,
          db
        );

        totalScore += score;
        maxPossibleScore += maxScore;
        if (detail) details.push(detail);
      }

      // Generate factor-specific recommendations
      const factorRecommendations = this.generateFactorRecommendations(factorKey, totalScore, maxPossibleScore);
      recommendations.push(...factorRecommendations);

    } catch (error) {
      Logger.error(`Error testing factor ${factorKey}:`, error);
      details.push(`Error testing ${factorKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      factor: factorKey,
      description: factor.description,
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage * 100) / 100,
      details,
      recommendations
    };
  }

  private generateTestPairs(persons: any[], maxPairs: number): ConnectionPair[] {
    const pairs: ConnectionPair[] = [];
    const shuffled = [...persons].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(maxPairs * 2, shuffled.length - 1); i += 2) {
      if (i + 1 < shuffled.length) {
        pairs.push({
          person1: this.convertToPersonTestData(shuffled[i]),
          person2: this.convertToPersonTestData(shuffled[i + 1])
        });
      }
    }

    return pairs.slice(0, maxPairs);
  }

  private convertToPersonTestData(person: any): PersonTestData {
    return {
      id: person.id || person._id?.toString(),
      name: person.name,
      company: person.company,
      department: person.department,
      title: person.title,
      education: person.education || [],
      location: person.location,
      hometown: person.hometown,
      spouse: person.spouse,
      socialMedia: {
        linkedin: person.linkedinUrl,
        twitter: person.twitterHandle,
        facebook: person.facebookUrl
      }
    };
  }

  private async evaluateConnectionFactor(
    factorKey: string,
    person1: PersonTestData,
    person2: PersonTestData,
    db: mongoose.mongo.Db
  ): Promise<{ score: number; maxScore: number; detail?: string }> {
    
    switch (factorKey) {
      case 'company':
        return this.evaluateCompanyFactor(person1, person2);
      
      case 'education':
        return this.evaluateEducationFactor(person1, person2);
      
      case 'location':
        return this.evaluateLocationFactor(person1, person2);
      
      case 'spouse':
        return this.evaluateFamilyFactor(person1, person2);
      
      case 'socialMedia':
        return this.evaluateSocialMediaFactor(person1, person2);
      
      case 'interactions':
        return await this.evaluateInteractionsFactor(person1, person2, db);
      
      case 'mutualConnections':
        return await this.evaluateMutualConnectionsFactor(person1, person2, db);
      
      default:
        return { score: 0, maxScore: 1, detail: `Unknown factor: ${factorKey}` };
    }
  }

  private evaluateCompanyFactor(person1: PersonTestData, person2: PersonTestData): { score: number; maxScore: number; detail?: string } {
    let score = 0;
    const maxScore = 3;

    if (person1.company && person2.company) {
      if (person1.company === person2.company) {
        score += 2;
        if (person1.department === person2.department) {
          score += 1;
        }
        return { 
          score, 
          maxScore, 
          detail: `Same company match: ${person1.name} and ${person2.name} both at ${person1.company}` 
        };
      }
    }

    return { score, maxScore };
  }

  private evaluateEducationFactor(person1: PersonTestData, person2: PersonTestData): { score: number; maxScore: number; detail?: string } {
    let score = 0;
    const maxScore = 2;
    const commonSchools: string[] = [];

    if (person1.education && person2.education) {
      for (const school1 of person1.education) {
        for (const school2 of person2.education) {
          if (school1.toLowerCase().includes(school2.toLowerCase()) || 
              school2.toLowerCase().includes(school1.toLowerCase())) {
            score += 1;
            commonSchools.push(school1);
            break;
          }
        }
      }
    }

    const detail = commonSchools.length > 0 
      ? `Education match: ${person1.name} and ${person2.name} share ${commonSchools.join(', ')}`
      : undefined;

    return { score: Math.min(score, maxScore), maxScore, detail };
  }

  private evaluateLocationFactor(person1: PersonTestData, person2: PersonTestData): { score: number; maxScore: number; detail?: string } {
    let score = 0;
    const maxScore = 2;

    if (person1.location && person2.location) {
      if (person1.location.toLowerCase() === person2.location.toLowerCase()) {
        score += 1;
      }
    }

    if (person1.hometown && person2.hometown) {
      if (person1.hometown.toLowerCase() === person2.hometown.toLowerCase()) {
        score += 1;
      }
    }

    const detail = score > 0 
      ? `Location match found between ${person1.name} and ${person2.name}`
      : undefined;

    return { score, maxScore, detail };
  }

  private evaluateFamilyFactor(person1: PersonTestData, person2: PersonTestData): { score: number; maxScore: number; detail?: string } {
    let score = 0;
    const maxScore = 1;

    if (person1.spouse && person2.spouse) {
      if (person1.spouse.toLowerCase() === person2.spouse.toLowerCase()) {
        score = 1;
        return { 
          score, 
          maxScore, 
          detail: `Family connection: ${person1.name} and ${person2.name} share family ties` 
        };
      }
    }

    return { score, maxScore };
  }

  private evaluateSocialMediaFactor(person1: PersonTestData, person2: PersonTestData): { score: number; maxScore: number; detail?: string } {
    let score = 0;
    const maxScore = 3;
    const platforms: string[] = [];

    if (person1.socialMedia && person2.socialMedia) {
      if (person1.socialMedia.linkedin && person2.socialMedia.linkedin) {
        score += 1;
        platforms.push('LinkedIn');
      }
      if (person1.socialMedia.twitter && person2.socialMedia.twitter) {
        score += 1;
        platforms.push('Twitter');
      }
      if (person1.socialMedia.facebook && person2.socialMedia.facebook) {
        score += 1;
        platforms.push('Facebook');
      }
    }

    const detail = platforms.length > 0 
      ? `Social media presence: ${person1.name} and ${person2.name} both on ${platforms.join(', ')}`
      : undefined;

    return { score, maxScore, detail };
  }

  private async evaluateInteractionsFactor(
    person1: PersonTestData, 
    person2: PersonTestData, 
    db: mongoose.mongo.Db
  ): Promise<{ score: number; maxScore: number; detail?: string }> {
    // This would check interaction history between people
    // For now, returning basic implementation
    return { score: 0, maxScore: 2, detail: 'Interaction history evaluation not yet implemented' };
  }

  private async evaluateMutualConnectionsFactor(
    person1: PersonTestData, 
    person2: PersonTestData, 
    db: mongoose.mongo.Db
  ): Promise<{ score: number; maxScore: number; detail?: string }> {
    try {
      // Look for mutual connections in relationships collection
      const mutualConnections = await db.collection('relationships').find({
        $or: [
          { fromPersonId: person1.id, toPersonId: { $ne: person2.id } },
          { toPersonId: person1.id, fromPersonId: { $ne: person2.id } }
        ]
      }).toArray();

      // This is a simplified implementation - would need more complex logic for real mutual connections
      const score = Math.min(mutualConnections.length * 0.1, 1);
      
      return { 
        score, 
        maxScore: 1, 
        detail: `Found ${mutualConnections.length} potential mutual connections` 
      };
    } catch (error) {
      return { score: 0, maxScore: 1, detail: 'Error evaluating mutual connections' };
    }
  }

  private generateFactorRecommendations(factorKey: string, score: number, maxScore: number): string[] {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const recommendations: string[] = [];

    if (percentage < 30) {
      switch (factorKey) {
        case 'company':
          recommendations.push('Collect more detailed company and department information');
          break;
        case 'education':
          recommendations.push('Gather comprehensive educational background data');
          break;
        case 'location':
          recommendations.push('Improve location and hometown data collection');
          break;
        case 'socialMedia':
          recommendations.push('Enhance social media profile integration');
          break;
      }
    }

    return recommendations;
  }

  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

    if (averageScore < 50) {
      recommendations.push('Overall connection strength scoring needs improvement');
      recommendations.push('Focus on data quality and completeness');
    }

    const weakFactors = results
      .filter(r => r.percentage < 30)
      .map(r => r.factor);

    if (weakFactors.length > 0) {
      recommendations.push(`Prioritize improving: ${weakFactors.join(', ')}`);
    }

    recommendations.push('Consider implementing more sophisticated scoring algorithms');
    recommendations.push('Expand data sources for better connection intelligence');

    return recommendations;
  }

  async testSpecificConnection(person1Id: string, person2Id: string): Promise<TestResult[]> {
    this.ensureInitialized();
    
    try {
      const db = mongoose.connection.db;
      const person1 = await db!.collection('persons').findOne({ id: person1Id });
      const person2 = await db!.collection('persons').findOne({ id: person2Id });

      if (!person1 || !person2) {
        throw new Error('One or both persons not found');
      }

      const results: TestResult[] = [];

      for (const [factorKey, factor] of Object.entries(this.connectionFactors)) {
        const { score, maxScore, detail } = await this.evaluateConnectionFactor(
          factorKey,
          this.convertToPersonTestData(person1),
          this.convertToPersonTestData(person2),
          db!
        );

        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

        results.push({
          factor: factorKey,
          description: factor.description,
          score,
          maxScore,
          percentage: Math.round(percentage * 100) / 100,
          details: detail ? [detail] : [],
          recommendations: this.generateFactorRecommendations(factorKey, score, maxScore)
        });
      }

      return results;
    } catch (error) {
      Logger.error('Error testing specific connection:', error);
      throw error;
    }
  }

  getTestHistory(): TestResult[] {
    return [...this.testResults];
  }

  getConnectionFactors(): Record<string, ConnectionFactor> {
    return { ...this.connectionFactors };
  }

  async getServiceHealth(): Promise<{
    status: string;
    initialized: boolean;
    mongoConnected: boolean;
    totalTests: number;
  }> {
    return {
      status: this.isInitialized ? 'healthy' : 'not initialized',
      initialized: this.isInitialized,
      mongoConnected: mongoose.connection.readyState === 1,
      totalTests: this.testResults.length
    };
  }

  async close(): Promise<void> {
    try {
      this.testResults = [];
      this.isInitialized = false;
      Logger.info('ConnectionTester service closed');
    } catch (error) {
      Logger.error('Error closing ConnectionTester service:', error);
    }
  }
}

// Export default instance
export default new ConnectionTester();