import { pgTable, text, integer, timestamp, jsonb, boolean, serial, unique, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Companies table with enrichment tracking
export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  location: text('location'),
  domain: text('domain'),
  industry: text('industry'),
  size: text('size'),
  description: text('description'),
  logo: text('logo'),
  founded: text('founded'),
  allowAll: boolean('allow_all').notNull().default(false),
  status: text('status').notNull().default('active'),
  lastEnrichedAt: timestamp('last_enriched_at'),
  enrichmentStatus: text('enrichment_status').default('pending'), // pending, done, error
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with Replit Auth support
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImageUrl: text('profile_image_url'),
  companyId: text('company_id').references(() => companies.id),
  title: text('title'),
  socialProfiles: jsonb('social_profiles'),
  education: jsonb('education'),
  family: jsonb('family'),
  greekLife: jsonb('greek_life'),
  hometowns: jsonb('hometowns'),
  privacySettings: jsonb('privacy_settings').default('{"showEmail": true, "showFamily": true, "showEducation": true}'),
  demo: boolean('demo').default(false),
  onboardingComplete: boolean('onboarding_complete').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  idxEmail: index('idx_user_email').on(table.email),
  idxCompany: index('idx_user_company').on(table.companyId)
}));

// Persons table for network graph nodes with ghost profile support
export const persons = pgTable('persons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  company: text('company'),
  title: text('title'),
  industry: text('industry'),
  location: text('location'),
  education: text('education'),
  greekLife: text('greek_life'),
  hometown: text('hometown'),
  spouse: text('spouse'),
  fraternity: text('fraternity'),
  socialProfiles: jsonb('social_profiles'),
  skills: jsonb('skills'),
  interests: jsonb('interests'),
  linkedin: text('linkedin'),
  linkedinProfile: text('linkedin_profile'),
  twitterHandle: text('twitter_handle'),
  facebookProfile: text('facebook_profile'),
  githubProfile: text('github_profile'),
  instagramHandle: text('instagram_handle'),
  family: jsonb('family'),
  hometowns: jsonb('hometowns'),
  source: text('source').default('manual'),
  isGhost: boolean('is_ghost').default(false), // stub vs confirmed profile
  ghostSource: text('ghost_source'), // PDL, Clearbit, Hunter
  trustScore: integer('trust_score').default(60), // 0-100, ghosts start at 60
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Social accounts table for user's connected social media profiles
export const socialAccounts = pgTable('social_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  platform: text('platform').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  profileId: text('profile_id'),
  profileData: text('profile_data'),
  isActive: boolean('is_active'),
  connectionCount: integer('connection_count'),
  lastSyncAt: timestamp('last_sync_at'),
  disconnectedAt: timestamp('disconnected_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  accountId: text('account_id').notNull()
});

// Cached lookups table for API responses
export const cachedLookups = pgTable('cached_lookups', {
  id: serial('id').primaryKey(),
  source: text('source').notNull(), // 'social_api', 'people_finder', 'whitepages', etc.
  query: text('query').notNull(), // Query parameters used
  result: jsonb('result').notNull(), // API response data
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Enhanced relationship edges with confidence scoring
export const relationshipEdges = pgTable('relationship_edges', {
  id: serial('id').primaryKey(),
  fromId: text('from_id').notNull(),
  toId: text('to_id').notNull(),
  type: text('type').notNull(), // COWORKER, ALUMNI, ASSISTANT_TO, BOARD_MEMBER, HOMETOWN
  confidenceScore: integer('confidence_score').default(50), // 0-100
  source: text('source').default('manual'), // manual, PDL, Clearbit, etc
  isGhost: boolean('is_ghost').default(false), // Person not yet in system
  evidence: text('evidence'), // JSON string with supporting data
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueRelationship: unique().on(table.fromId, table.toId, table.type),
  idxFromId: index('idx_from_id').on(table.fromId),
  idxToId: index('idx_to_id').on(table.toId),
  idxType: index('idx_relationship_type').on(table.type),
  idxConfidence: index('idx_confidence_score').on(table.confidenceScore)
}));

// Introduction requests table for production system
export const introductionRequests = pgTable('introduction_requests', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').notNull(),
  connectorId: text('connector_id').notNull(),
  targetId: text('target_id').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  pathData: text('path_data'),
  timestamp: timestamp('timestamp').defaultNow()
});

// External profiles for API data with proper deduplication
export const externalProfiles = pgTable('external_profiles', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  source: text('source').notNull(), // PDL, Clearbit, Hunter, ZoomInfo
  externalId: text('external_id').notNull(),
  rawJson: text('raw_json').notNull(), // JSONB equivalent as text
  importedAt: timestamp('imported_at').defaultNow(),
  pdlId: text('pdl_id'),
  clearbitId: text('clearbit_id'),
  hunterId: text('hunter_id')
}, (table) => ({
  uniqueEmail: unique().on(table.userId, table.source),
  uniqueExternalId: unique().on(table.externalId, table.source)
}));

// Relationship confidence and metadata for advanced analysis
export const relationshipMetadata = pgTable('relationship_metadata', {
  id: text('id').primaryKey(),
  relationshipId: integer('relationship_id').references(() => relationships.id),
  source: text('source').notNull(), // How relationship was discovered
  confidence: integer('confidence').default(100), // 0-100 confidence
  evidenceType: text('evidence_type'), // job_overlap, alumni, family, etc
  evidenceDetails: text('evidence_details'), // JSON with specifics
  lastVerified: timestamp('last_verified').defaultNow()
});

// Path cache for hot lookups with TTL
export const pathCache = pgTable('path_cache', {
  startId: text('start_id').notNull(),
  endId: text('end_id').notNull(),
  shortestPath: text('shortest_path').notNull(), // JSON path data
  confidenceScore: integer('confidence_score'),
  hops: integer('hops'),
  ttl: timestamp('ttl').notNull(), // Time to live
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.startId, table.endId] }),
  idxTtl: index('idx_path_ttl').on(table.ttl)
}));

// API usage tracking for cost management
export const apiUsage = pgTable('api_usage', {
  id: text('id').primaryKey(),
  apiSource: text('api_source').notNull(), // pdl, clearbit, etc
  endpoint: text('endpoint'),
  requestCount: integer('request_count').default(1),
  cost: text('cost'), // Track API costs as text to avoid decimal issues
  date: timestamp('date').defaultNow(),
  status: text('status') // success, error, rate_limited
});



// Background job queue for async processing
export const backgroundJobs = pgTable('background_jobs', {
  id: text('id').primaryKey(),
  jobType: text('job_type').notNull(), // enrich_company, api_import, relationship_analysis, etc
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  payload: text('payload'), // JSON job data
  priority: integer('priority').default(5), // 1-10 priority scale
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  scheduledFor: timestamp('scheduled_for').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow()
});

// Edge weights configuration for ghost profiles
export const edgeWeights = pgTable('edge_weights', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // COWORKER, SCHOOL, ALUMNI, etc
  baseWeight: integer('base_weight').default(100), // 0-100 base weight
  ghostPenalty: integer('ghost_penalty').default(30), // penalty when ghost involved
  description: text('description')
});

// Invitations for ghost profile activation
export const invites = pgTable('invites', {
  id: text('id').primaryKey(),
  ghostUserId: text('ghost_user_id').references(() => persons.id),
  requesterId: text('requester_id').notNull(),
  targetId: text('target_id').notNull(),
  token: text('token').notNull().unique(),
  status: text('status').default('sent'), // sent, accepted, expired
  emailSent: boolean('email_sent').default(false),
  activatedAt: timestamp('activated_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Define relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users)
}));

export const relationshipEdgesRelations = relations(relationshipEdges, ({ one }) => ({
  fromPerson: one(persons, {
    fields: [relationshipEdges.fromId],
    references: [persons.id],
    relationName: 'fromPerson'
  }),
  toPerson: one(persons, {
    fields: [relationshipEdges.toId], 
    references: [persons.id],
    relationName: 'toPerson'
  })
}));

export const externalProfilesRelations = relations(externalProfiles, ({ one }) => ({
  user: one(users, {
    fields: [externalProfiles.userId],
    references: [users.id]
  })
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  introductionRequests: many(introductionRequests),
  socialAccounts: many(socialAccounts),
  externalProfiles: many(externalProfiles),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id]
  })
}));

export const personsRelations = relations(persons, ({ many }) => ({
  fromRelationshipEdges: many(relationshipEdges, { relationName: 'fromPerson' }),
  toRelationshipEdges: many(relationshipEdges, { relationName: 'toPerson' }),
  introductionRequestsAsConnector: many(introductionRequests, { relationName: 'connector' }),
  introductionRequestsAsTarget: many(introductionRequests, { relationName: 'target' })
}));

export const introductionRequestsRelations = relations(introductionRequests, ({ one }) => ({
  requester: one(users, {
    fields: [introductionRequests.requesterId],
    references: [users.id],
    relationName: 'requester'
  }),
  connector: one(persons, {
    fields: [introductionRequests.connectorId],
    references: [persons.id],
    relationName: 'connector'
  }),
  target: one(persons, {
    fields: [introductionRequests.targetId],
    references: [persons.id],
    relationName: 'target'
  })
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id]
  })
}));

export const cachedLookupsRelations = relations(cachedLookups, ({}) => ({}));

// Business Chat Friend tables
export const businessProfiles = pgTable('business_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  hometown: text('hometown'),
  almaMater: text('alma_mater'),
  pastCompanies: jsonb('past_companies').$type<string[]>().default([]),
  currentDeals: jsonb('current_deals').$type<string[]>().default([]),
  hobbies: jsonb('hobbies').$type<string[]>().default([]),
  lastLLMVectorId: text('last_llm_vector_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  idxUserId: index('idx_business_profile_user_id').on(table.userId)
}));

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
  vectorId: text('vector_id'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  idxUserId: index('idx_chat_messages_user_id').on(table.userId),
  idxCreatedAt: index('idx_chat_messages_created_at').on(table.createdAt)
}));

export const enrichmentData = pgTable('enrichment_data', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  companyDomain: text('company_domain'),
  email: text('email'),
  source: text('source').$type<'pdl' | 'clearbit' | 'hunter'>().notNull(),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  idxUserEmail: unique('idx_enrichment_user_email').on(table.userId, table.email),
  idxCompanyDomain: index('idx_enrichment_company_domain').on(table.companyDomain)
}));

// Relations for new tables
export const businessProfilesRelations = relations(businessProfiles, ({ one }) => ({
  user: one(users, {
    fields: [businessProfiles.userId],
    references: [users.id]
  })
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id]
  })
}));

export const enrichmentDataRelations = relations(enrichmentData, ({ one }) => ({
  user: one(users, {
    fields: [enrichmentData.userId],
    references: [users.id]
  })
}));

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


// Zod schemas for validation
export const insertCompanySchema = createInsertSchema(companies).omit({
  createdAt: true,
  updatedAt: true
});

export const selectCompanySchema = createSelectSchema(companies);

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});

export const insertPersonSchema = createInsertSchema(persons).omit({
  createdAt: true,
  updatedAt: true
});

export const insertRelationshipEdgeSchema = createInsertSchema(relationshipEdges).omit({
  id: true,
  createdAt: true
});

export const insertIntroductionRequestSchema = createInsertSchema(introductionRequests);

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCachedLookupSchema = createInsertSchema(cachedLookups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});

export const insertEnrichmentDataSchema = createInsertSchema(enrichmentData).omit({
  id: true,
  createdAt: true
});

export const insertConnectionSearchSchema = createInsertSchema(connectionSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Person = typeof persons.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type RelationshipEdge = typeof relationshipEdges.$inferSelect;
export type InsertRelationshipEdge = z.infer<typeof insertRelationshipEdgeSchema>;

// Legacy compatibility
export const relationships = relationshipEdges;
export type Relationship = RelationshipEdge;
export type InsertRelationship = InsertRelationshipEdge;
export type IntroductionRequest = typeof introductionRequests.$inferSelect;
export type InsertIntroductionRequest = z.infer<typeof insertIntroductionRequestSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type CachedLookup = typeof cachedLookups.$inferSelect;
export type InsertCachedLookup = z.infer<typeof insertCachedLookupSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type EnrichmentData = typeof enrichmentData.$inferSelect;
export type InsertEnrichmentData = z.infer<typeof insertEnrichmentDataSchema>;
export type ConnectionSearch = typeof connectionSearches.$inferSelect;
export type InsertConnectionSearch = z.infer<typeof insertConnectionSearchSchema>;