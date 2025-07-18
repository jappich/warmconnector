// Background job processing service for async API operations
// Handles rate limiting, retries, and job queue management

import { db } from '../db';
import { backgroundJobs, apiUsage } from '@shared/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

interface JobPayload {
  [key: string]: any;
}

interface Job {
  id: string;
  jobType: string;
  payload: JobPayload;
  priority: number;
  attempts: number;
  maxAttempts: number;
}

export class BackgroundJobService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private apiLimits = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    this.startProcessing();
  }

  // Add a new job to the queue
  async addJob(
    jobType: string, 
    payload: JobPayload, 
    priority: number = 5,
    scheduledFor?: Date
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(backgroundJobs).values({
      id: jobId,
      jobType,
      payload: JSON.stringify(payload),
      priority,
      scheduledFor: scheduledFor || new Date(),
      createdAt: new Date()
    });

    console.log(`📋 Job queued: ${jobType} (${jobId})`);
    return jobId;
  }

  // Process jobs from the queue
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('🚀 Background job processor started');

    this.processingInterval = setInterval(async () => {
      try {
        await this.processNextJob();
      } catch (error) {
        console.error('Job processing error:', error);
      }
    }, 5000); // Check for jobs every 5 seconds
  }

  private async processNextJob(): Promise<void> {
    // Get the highest priority pending job
    const jobs = await db.select()
      .from(backgroundJobs)
      .where(
        and(
          eq(backgroundJobs.status, 'pending'),
          lte(backgroundJobs.scheduledFor, new Date())
        )
      )
      .orderBy(backgroundJobs.priority, backgroundJobs.createdAt)
      .limit(1);

    if (jobs.length === 0) return;

    const job = jobs[0];
    await this.executeJob(job);
  }

  private async executeJob(job: typeof backgroundJobs.$inferSelect): Promise<void> {
    const jobId = job.id;
    
    try {
      // Mark job as running
      await db.update(backgroundJobs)
        .set({ 
          status: 'running', 
          startedAt: new Date(),
          attempts: (job.attempts || 0) + 1
        })
        .where(eq(backgroundJobs.id, jobId));

      console.log(`⚡ Processing job: ${job.jobType} (${jobId})`);

      const payload = JSON.parse(job.payload || '{}');
      
      // Execute job based on type
      switch (job.jobType) {
        case 'enrich_company':
          await this.processCompanyEnrichment(payload);
          break;
        case 'api_company_import':
          await this.processCompanyImport(payload);
          break;
        case 'api_person_enrichment':
          await this.processPersonEnrichment(payload);
          break;
        case 'relationship_analysis':
          await this.processRelationshipAnalysis(payload);
          break;
        case 'connection_path_cache':
          await this.processConnectionPathCache(payload);
          break;
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark job as completed
      await db.update(backgroundJobs)
        .set({ 
          status: 'completed', 
          completedAt: new Date() 
        })
        .where(eq(backgroundJobs.id, jobId));

      console.log(`✅ Job completed: ${job.jobType} (${jobId})`);

    } catch (error) {
      console.error(`❌ Job failed: ${job.jobType} (${jobId}):`, error);

      const attempts = (job.attempts || 0) + 1;
      const maxAttempts = job.maxAttempts || 3;

      if (attempts >= maxAttempts) {
        // Mark as failed
        await db.update(backgroundJobs)
          .set({ 
            status: 'failed', 
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(backgroundJobs.id, jobId));
      } else {
        // Retry later with exponential backoff
        const retryDelay = Math.pow(2, attempts) * 60 * 1000; // 2^attempts minutes
        const retryTime = new Date(Date.now() + retryDelay);
        
        await db.update(backgroundJobs)
          .set({ 
            status: 'pending',
            scheduledFor: retryTime,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(backgroundJobs.id, jobId));

        console.log(`🔄 Job scheduled for retry: ${job.jobType} (${jobId}) at ${retryTime.toISOString()}`);
      }
    }
  }

  // Job processors for different types
  private async processCompanyEnrichment(payload: JobPayload): Promise<void> {
    const { companyId, domain } = payload;
    
    console.log(`Enriching company ${companyId} (${domain})`);
    
    const { companyEnrichmentService } = await import('./companyEnrichmentService');
    const result = await companyEnrichmentService.enrichCompany(companyId, domain);
    
    console.log(`Company enrichment complete: ${result.ghostProfilesCreated} profiles, ${result.relationshipsCreated} relationships`);
  }

  private async processCompanyImport(payload: JobPayload): Promise<void> {
    const { companyName, apiSource } = payload;
    
    // Check API rate limits
    if (!this.canMakeApiCall(apiSource)) {
      throw new Error(`Rate limit exceeded for ${apiSource}`);
    }

    // Import company data (placeholder - actual API integration would go here)
    console.log(`Importing company data for ${companyName} from ${apiSource}`);
    
    // Record API usage
    await this.recordApiUsage(apiSource, 'company_search', 1, 0.10);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async processPersonEnrichment(payload: JobPayload): Promise<void> {
    const { personId, email, apiSource } = payload;
    
    if (!this.canMakeApiCall(apiSource)) {
      throw new Error(`Rate limit exceeded for ${apiSource}`);
    }

    console.log(`Enriching person ${personId} with ${apiSource}`);
    
    // Record API usage
    await this.recordApiUsage(apiSource, 'person_enrichment', 1, 0.05);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async processRelationshipAnalysis(payload: JobPayload): Promise<void> {
    const { analysisType, targetIds } = payload;
    
    console.log(`Running ${analysisType} analysis for ${targetIds?.length || 0} targets`);
    
    // Import relationship intelligence service
    const { relationshipIntelligenceService } = await import('./relationshipIntelligenceService');
    
    // Run analysis based on type
    switch (analysisType) {
      case 'alumni_detection':
        for (const personId of targetIds || []) {
          await relationshipIntelligenceService.detectAlumniConnections(personId);
        }
        break;
      case 'executive_assistants':
        await relationshipIntelligenceService.identifyExecutiveAssistants();
        break;
      case 'board_connections':
        await relationshipIntelligenceService.detectBoardConnections();
        break;
      default:
        await relationshipIntelligenceService.runFullAnalysis();
    }
  }

  private async processConnectionPathCache(payload: JobPayload): Promise<void> {
    const { personIds, maxHops } = payload;
    
    console.log(`Caching connection paths for ${personIds?.length || 0} people`);
    
    const { performanceOptimizationService } = await import('./performanceOptimizationService');
    await performanceOptimizationService.precomputeConnectionPaths(personIds || []);
  }

  // API rate limiting
  private canMakeApiCall(apiSource: string): boolean {
    const limits = {
      'pdl': { maxPerHour: 1000, maxPerSecond: 5 },
      'clearbit': { maxPerHour: 500, maxPerSecond: 2 },
      'zoominfo': { maxPerHour: 200, maxPerSecond: 1 },
      'hunter': { maxPerHour: 100, maxPerSecond: 1 }
    };

    const limit = limits[apiSource as keyof typeof limits];
    if (!limit) return true;

    const now = Date.now();
    const hourStart = now - (now % (60 * 60 * 1000));
    
    const usage = this.apiLimits.get(`${apiSource}_hour`);
    if (usage && usage.resetTime === hourStart && usage.count >= limit.maxPerHour) {
      return false;
    }

    return true;
  }

  private async recordApiUsage(
    apiSource: string, 
    endpoint: string, 
    requestCount: number, 
    cost: number
  ): Promise<void> {
    await db.insert(apiUsage).values({
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      apiSource,
      endpoint,
      requestCount,
      cost: cost.toString(),
      date: new Date(),
      status: 'success'
    });

    // Update in-memory rate limiting
    const now = Date.now();
    const hourStart = now - (now % (60 * 60 * 1000));
    const key = `${apiSource}_hour`;
    
    const current = this.apiLimits.get(key);
    if (!current || current.resetTime !== hourStart) {
      this.apiLimits.set(key, { count: requestCount, resetTime: hourStart });
    } else {
      this.apiLimits.set(key, { count: current.count + requestCount, resetTime: hourStart });
    }
  }

  // Queue management methods
  async getQueueStatus(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const results = await db.execute(sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM background_jobs 
      GROUP BY status
    `);

    const stats = { pending: 0, running: 0, completed: 0, failed: 0 };
    
    for (const row of results) {
      const status = row.status as keyof typeof stats;
      stats[status] = Number(row.count);
    }

    return stats;
  }

  async getApiUsageStats(): Promise<{
    totalRequests: number;
    totalCost: number;
    bySource: Record<string, { requests: number; cost: number }>;
  }> {
    const results = await db.execute(sql`
      SELECT 
        api_source,
        SUM(request_count) as total_requests,
        SUM(CAST(cost AS DECIMAL)) as total_cost
      FROM api_usage 
      WHERE date >= NOW() - INTERVAL '24 hours'
      GROUP BY api_source
    `);

    let totalRequests = 0;
    let totalCost = 0;
    const bySource: Record<string, { requests: number; cost: number }> = {};

    for (const row of results) {
      const requests = Number(row.total_requests);
      const cost = Number(row.total_cost);
      
      totalRequests += requests;
      totalCost += cost;
      
      bySource[row.api_source as string] = {
        requests,
        cost
      };
    }

    return { totalRequests, totalCost, bySource };
  }

  // Clean up old jobs
  async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const result = await db.execute(sql`
      DELETE FROM background_jobs 
      WHERE created_at < ${cutoffDate}
      AND status IN ('completed', 'failed')
    `);

    return result.rowCount || 0;
  }

  // Stop processing
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('🛑 Background job processor stopped');
  }
}

export const backgroundJobService = new BackgroundJobService();