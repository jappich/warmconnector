import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Companies table
export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  industry: text('industry'),
  description: text('description'),
  logo: text('logo'),
  size: text('size'), // 'startup', 'small', 'medium', 'large', 'enterprise'
  location: text('location'),
  founded: text('founded'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Connection searches table
export const connectionSearches = pgTable('connection_searches', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  companyId: text('company_id').notNull(),
  companyName: text('company_name').notNull(),
  location: text('location').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'completed', 'failed'
  results: text('results'), // JSON string of search results
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schemas for validation
export const insertCompanySchema = createInsertSchema(companies).omit({
  createdAt: true,
  updatedAt: true,
});

export const selectCompanySchema = createSelectSchema(companies);

export const insertConnectionSearchSchema = createInsertSchema(connectionSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectConnectionSearchSchema = createSelectSchema(connectionSearches);

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type ConnectionSearch = typeof connectionSearches.$inferSelect;
export type InsertConnectionSearch = z.infer<typeof insertConnectionSearchSchema>;