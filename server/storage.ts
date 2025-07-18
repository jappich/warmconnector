import { 
  users, 
  type User, 
  type UpsertUser,
  companies,
  type Company,
  type InsertCompany,
  persons,
  type Person,
  type InsertPerson,
  relationshipEdges,
  type RelationshipEdge,
  type InsertRelationshipEdge,
  introRequests,
  type IntroRequest,
  type InsertIntroRequest
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Person methods
  getPerson(id: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  
  // Relationship methods
  createRelationship(relationship: InsertRelationshipEdge): Promise<RelationshipEdge>;
  
  // Introduction request methods
  createIntroRequest(request: InsertIntroRequest): Promise<IntroRequest>;
  getIntroRequests(): Promise<IntroRequest[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  
  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.domain, domain));
    return company;
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }
  
  // Person methods
  async getPerson(id: string): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person;
  }
  
  async createPerson(person: InsertPerson): Promise<Person> {
    const [newPerson] = await db.insert(persons).values(person).returning();
    return newPerson;
  }
  
  // Relationship methods
  async createRelationship(relationship: InsertRelationshipEdge): Promise<RelationshipEdge> {
    const [newRelationship] = await db.insert(relationshipEdges).values(relationship).returning();
    return newRelationship;
  }
  
  // Introduction request methods
  async createIntroRequest(request: InsertIntroRequest): Promise<IntroRequest> {
    const [newRequest] = await db.insert(introRequests).values(request).returning();
    return newRequest;
  }
  
  async getIntroRequests(): Promise<IntroRequest[]> {
    return db.select().from(introRequests);
  }
}

export const storage = new DatabaseStorage();