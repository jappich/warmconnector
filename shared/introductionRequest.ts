import { pgTable, text, integer, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const introductionRequests = pgTable('introduction_requests_new', {
  id: serial('id').primaryKey(),
  requesterId: text('requester_id').notNull(),
  connectorId: text('connector_id').notNull(),
  targetId: text('target_id').notNull(),
  path: jsonb('path').notNull(), // Array of oktaIds in the path
  message: text('message').notNull(),
  status: text('status').default('pending'), // pending, sent, accepted, declined
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertIntroductionRequestSchema = createInsertSchema(introductionRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type IntroductionRequest = typeof introductionRequests.$inferSelect;
export type InsertIntroductionRequest = z.infer<typeof insertIntroductionRequestSchema>;