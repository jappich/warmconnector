import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

// TypeScript interfaces for company network service
export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  title?: string;
  companyId: string;
  status: 'active' | 'inactive';
  connections: Connection[];
}

export interface Connection {
  personId: string;
  name: string;
  company?: string;
  title?: string;
  relationshipType: string;
  strength: number;
  lastContact?: Date;
}

export interface CompanyNetwork {
  companyId: string;
  companyName: string;
  totalEmployees: number;
  totalConnections: number;
  networkStrength: number;
  topConnectedEmployees: Array<{
    employeeId: string;
    name: string;
    connectionCount: number;
    networkValue: number;
  }>;
  externalCompanies: Array<{
    companyName: string;
    connectionCount: number;
    strength: number;
  }>;
}

export interface NetworkAnalytics {
  totalCompanies: number;
  totalEmployees: number;
  totalConnections: number;
  averageConnectionsPerEmployee: number;
  strongestCompanyNetworks: CompanyNetwork[];
  crossCompanyConnections: Array<{
    fromCompany: string;
    toCompany: string;
    connectionCount: number;
    strength: number;
  }>;
}

export interface PathfindingResult {
  path: Array<{
    personId: string;
    name: string;
    company?: string;
    role: 'employee' | 'external_contact';
  }>;
  pathLength: number;
  totalStrength: number;
  pathType: 'internal' | 'external' | 'mixed';
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
        
        Logger.info(`MongoDB connected for company network service (attempt ${attempt + 1})`);
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

export class CompanyNetworkService {
  private companyEmployees: Map<string, Employee> = new Map();
  private networkGraph: Map<string, CompanyNetwork> = new Map();
  private lastUpdate: Date | null = null;
  private mongoConnection: MongoConnection;
  private isInitialized: boolean = false;

  constructor() {
    this.mongoConnection = MongoConnection.getInstance();
  }

  async initialize(): Promise<boolean> {
    try {
      await this.mongoConnection.connect();
      this.isInitialized = true;
      Logger.info('Company network service initialized');
      await this.buildNetworkGraph();
      return true;
    } catch (error) {
      Logger.error('Company network service initialization failed:', error);
      return false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CompanyNetworkService not initialized. Call initialize() first.');
    }
  }

  async buildNetworkGraph(): Promise<void> {
    this.ensureInitialized();
    
    try {
      const db = mongoose.connection.db;
      
      // Get all company employees (from users/onboarding)
      const employees = await db!.collection('users').find({
        companyId: { $exists: true },
        status: 'active'
      }).toArray();

      this.companyEmployees.clear();
      
      // Build employee network map
      for (const employee of employees) {
        const employeeId = employee._id.toString();
        
        // Get all external connections for this employee
        const connections = await db!.collection('persons').find({
          userId: employee._id
        }).toArray();

        const connectionIds = connections.map(c => c._id.toString());
        
        const relationships = await db!.collection('relationships').find({
          $or: [
            { fromPersonId: { $in: connectionIds } },
            { toPersonId: { $in: connectionIds } }
          ]
        }).toArray();

        // Process relationships to create connection objects
        const employeeConnections: Connection[] = [];
        
        for (const relationship of relationships) {
          const isFromConnection = connectionIds.includes(relationship.fromPersonId);
          const targetPersonId = isFromConnection ? relationship.toPersonId : relationship.fromPersonId;
          
          // Get target person details
          const targetPerson = await db!.collection('persons').findOne({
            _id: new mongoose.Types.ObjectId(targetPersonId)
          });

          if (targetPerson) {
            employeeConnections.push({
              personId: targetPersonId,
              name: targetPerson.name || 'Unknown',
              company: targetPerson.company,
              title: targetPerson.title,
              relationshipType: relationship.relationshipType || 'colleague',
              strength: relationship.strength || 5,
              lastContact: relationship.lastContact || new Date()
            });
          }
        }

        // Store employee with connections
        this.companyEmployees.set(employeeId, {
          id: employeeId,
          name: employee.name || employee.email,
          email: employee.email,
          department: employee.department,
          title: employee.title,
          companyId: employee.companyId,
          status: 'active',
          connections: employeeConnections
        });
      }

      // Build company network summaries
      await this.buildCompanyNetworks();
      
      this.lastUpdate = new Date();
      Logger.info(`Network graph built: ${this.companyEmployees.size} employees across ${this.networkGraph.size} companies`);
      
    } catch (error) {
      Logger.error('Error building network graph:', error);
      throw error;
    }
  }

  private async buildCompanyNetworks(): Promise<void> {
    const companyMap = new Map<string, {
      employees: Employee[];
      name: string;
    }>();

    // Group employees by company
    for (const employee of this.companyEmployees.values()) {
      if (!companyMap.has(employee.companyId)) {
        // Get company name from database
        const db = mongoose.connection.db;
        const company = await db!.collection('companies').findOne({
          _id: new mongoose.Types.ObjectId(employee.companyId)
        });
        
        companyMap.set(employee.companyId, {
          employees: [],
          name: company?.name || `Company ${employee.companyId}`
        });
      }
      
      companyMap.get(employee.companyId)!.employees.push(employee);
    }

    // Build network analytics for each company
    for (const [companyId, companyData] of companyMap) {
      const employees = companyData.employees;
      const totalConnections = employees.reduce((sum, emp) => sum + emp.connections.length, 0);
      
      // Calculate network strength
      const networkStrength = employees.reduce((sum, emp) => {
        return sum + emp.connections.reduce((connSum, conn) => connSum + conn.strength, 0);
      }, 0) / Math.max(totalConnections, 1);

      // Find top connected employees
      const topConnectedEmployees = employees
        .map(emp => ({
          employeeId: emp.id,
          name: emp.name,
          connectionCount: emp.connections.length,
          networkValue: emp.connections.reduce((sum, conn) => sum + conn.strength, 0)
        }))
        .sort((a, b) => b.networkValue - a.networkValue)
        .slice(0, 10);

      // Find external companies connected to
      const externalCompanies = new Map<string, { count: number; strength: number }>();
      
      for (const employee of employees) {
        for (const connection of employee.connections) {
          if (connection.company && connection.company !== companyData.name) {
            const existing = externalCompanies.get(connection.company) || { count: 0, strength: 0 };
            existing.count += 1;
            existing.strength += connection.strength;
            externalCompanies.set(connection.company, existing);
          }
        }
      }

      const externalCompanyArray = Array.from(externalCompanies.entries())
        .map(([name, data]) => ({
          companyName: name,
          connectionCount: data.count,
          strength: data.strength / data.count
        }))
        .sort((a, b) => b.connectionCount - a.connectionCount)
        .slice(0, 15);

      const companyNetwork: CompanyNetwork = {
        companyId,
        companyName: companyData.name,
        totalEmployees: employees.length,
        totalConnections,
        networkStrength,
        topConnectedEmployees,
        externalCompanies: externalCompanyArray
      };

      this.networkGraph.set(companyId, companyNetwork);
    }
  }

  async getCompanyNetwork(companyId: string): Promise<CompanyNetwork | null> {
    this.ensureInitialized();
    
    // Refresh if data is stale (older than 1 hour)
    if (!this.lastUpdate || Date.now() - this.lastUpdate.getTime() > 3600000) {
      await this.buildNetworkGraph();
    }
    
    return this.networkGraph.get(companyId) || null;
  }

  async getEmployeeConnections(employeeId: string): Promise<Connection[]> {
    this.ensureInitialized();
    
    const employee = this.companyEmployees.get(employeeId);
    return employee ? employee.connections : [];
  }

  async findConnectionPath(
    fromEmployeeId: string, 
    toPersonId: string, 
    maxHops: number = 4
  ): Promise<PathfindingResult[]> {
    this.ensureInitialized();
    
    const fromEmployee = this.companyEmployees.get(fromEmployeeId);
    if (!fromEmployee) {
      throw new Error('Employee not found');
    }

    // Implement breadth-first search for connection paths
    const visited = new Set<string>();
    const queue: Array<{
      currentPersonId: string;
      path: Array<{ personId: string; name: string; company?: string; role: 'employee' | 'external_contact' }>;
      totalStrength: number;
      hops: number;
    }> = [];

    // Start with the employee
    queue.push({
      currentPersonId: fromEmployeeId,
      path: [{
        personId: fromEmployeeId,
        name: fromEmployee.name,
        company: fromEmployee.companyId,
        role: 'employee'
      }],
      totalStrength: 0,
      hops: 0
    });

    const results: PathfindingResult[] = [];

    while (queue.length > 0 && results.length < 10) {
      const current = queue.shift()!;
      
      if (current.hops >= maxHops) continue;
      if (visited.has(current.currentPersonId)) continue;
      
      visited.add(current.currentPersonId);

      // Check if we reached the target
      if (current.currentPersonId === toPersonId) {
        results.push({
          path: current.path,
          pathLength: current.hops,
          totalStrength: current.totalStrength,
          pathType: this.determinePathType(current.path)
        });
        continue;
      }

      // Get connections for current person
      const currentEmployee = this.companyEmployees.get(current.currentPersonId);
      if (currentEmployee) {
        for (const connection of currentEmployee.connections) {
          if (!visited.has(connection.personId)) {
            queue.push({
              currentPersonId: connection.personId,
              path: [...current.path, {
                personId: connection.personId,
                name: connection.name,
                company: connection.company,
                role: 'external_contact'
              }],
              totalStrength: current.totalStrength + connection.strength,
              hops: current.hops + 1
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.totalStrength - a.totalStrength);
  }

  private determinePathType(path: Array<{ role: 'employee' | 'external_contact' }>): 'internal' | 'external' | 'mixed' {
    const hasEmployee = path.some(p => p.role === 'employee');
    const hasExternal = path.some(p => p.role === 'external_contact');
    
    if (hasEmployee && hasExternal) return 'mixed';
    if (hasEmployee) return 'internal';
    return 'external';
  }

  async getNetworkAnalytics(): Promise<NetworkAnalytics> {
    this.ensureInitialized();
    
    const companies = Array.from(this.networkGraph.values());
    const totalEmployees = Array.from(this.companyEmployees.values()).length;
    const totalConnections = Array.from(this.companyEmployees.values())
      .reduce((sum, emp) => sum + emp.connections.length, 0);

    const averageConnectionsPerEmployee = totalEmployees > 0 ? totalConnections / totalEmployees : 0;

    // Find cross-company connections
    const crossCompanyConnections = new Map<string, { count: number; strength: number }>();
    
    for (const employee of this.companyEmployees.values()) {
      for (const connection of employee.connections) {
        if (connection.company) {
          const key = `${employee.companyId}->${connection.company}`;
          const existing = crossCompanyConnections.get(key) || { count: 0, strength: 0 };
          existing.count += 1;
          existing.strength += connection.strength;
          crossCompanyConnections.set(key, existing);
        }
      }
    }

    const crossCompanyArray = Array.from(crossCompanyConnections.entries())
      .map(([key, data]) => {
        const [fromCompany, toCompany] = key.split('->');
        return {
          fromCompany,
          toCompany,
          connectionCount: data.count,
          strength: data.strength / data.count
        };
      })
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 20);

    return {
      totalCompanies: companies.length,
      totalEmployees,
      totalConnections,
      averageConnectionsPerEmployee: Math.round(averageConnectionsPerEmployee * 100) / 100,
      strongestCompanyNetworks: companies
        .sort((a, b) => b.networkStrength - a.networkStrength)
        .slice(0, 10),
      crossCompanyConnections: crossCompanyArray
    };
  }

  async searchCompanyEmployees(companyId: string, query: string): Promise<Employee[]> {
    this.ensureInitialized();
    
    const employees = Array.from(this.companyEmployees.values())
      .filter(emp => emp.companyId === companyId);

    if (!query) return employees;

    const queryLower = query.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(queryLower) ||
      emp.email.toLowerCase().includes(queryLower) ||
      emp.department?.toLowerCase().includes(queryLower) ||
      emp.title?.toLowerCase().includes(queryLower)
    );
  }

  async getCompanyConnections(companyName: string): Promise<Array<{
    employeeName: string;
    connectionName: string;
    relationshipType: string;
    strength: number;
  }>> {
    this.ensureInitialized();
    
    const connections: Array<{
      employeeName: string;
      connectionName: string;
      relationshipType: string;
      strength: number;
    }> = [];

    for (const employee of this.companyEmployees.values()) {
      for (const connection of employee.connections) {
        if (connection.company === companyName) {
          connections.push({
            employeeName: employee.name,
            connectionName: connection.name,
            relationshipType: connection.relationshipType,
            strength: connection.strength
          });
        }
      }
    }

    return connections.sort((a, b) => b.strength - a.strength);
  }

  getServiceHealth(): {
    status: string;
    lastUpdate: Date | null;
    totalEmployees: number;
    totalCompanies: number;
    dataFreshness: string;
  } {
    const now = new Date();
    const dataFreshness = this.lastUpdate 
      ? `${Math.round((now.getTime() - this.lastUpdate.getTime()) / 60000)} minutes old`
      : 'never updated';

    return {
      status: this.isInitialized ? 'healthy' : 'not initialized',
      lastUpdate: this.lastUpdate,
      totalEmployees: this.companyEmployees.size,
      totalCompanies: this.networkGraph.size,
      dataFreshness
    };
  }

  async forceRefresh(): Promise<void> {
    Logger.info('Forcing network graph refresh');
    await this.buildNetworkGraph();
  }

  async close(): Promise<void> {
    try {
      this.companyEmployees.clear();
      this.networkGraph.clear();
      this.lastUpdate = null;
      this.isInitialized = false;
      Logger.info('CompanyNetworkService connections closed');
    } catch (error) {
      Logger.error('Error closing CompanyNetworkService:', error);
    }
  }
}

// Export default instance
export default new CompanyNetworkService();