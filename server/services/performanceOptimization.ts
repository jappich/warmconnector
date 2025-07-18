import { db } from '../db';
import { persons, relationshipEdges } from '../../shared/schema';
import { sql, eq, and } from 'drizzle-orm';
import NodeCache from 'node-cache';

interface PerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  optimizationApplied: string[];
}

interface CacheConfig {
  ttl: number; // Time to live in seconds
  checkperiod: number; // Check period for expired keys
  maxKeys: number; // Maximum number of keys
}

export class PerformanceOptimization {
  private queryCache!: NodeCache;
  private connectionCache!: NodeCache;
  private profileCache!: NodeCache;
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();

  constructor() {
    this.initializeCaches();
  }

  private initializeCaches() {
    const defaultConfig: CacheConfig = {
      ttl: 300, // 5 minutes
      checkperiod: 60, // Check every minute
      maxKeys: 1000
    };

    // Query result cache for expensive operations
    this.queryCache = new NodeCache({
      stdTTL: defaultConfig.ttl,
      checkperiod: defaultConfig.checkperiod,
      maxKeys: defaultConfig.maxKeys
    });

    // Connection path cache for pathfinding
    this.connectionCache = new NodeCache({
      stdTTL: 600, // 10 minutes for connection paths
      checkperiod: defaultConfig.checkperiod,
      maxKeys: 500
    });

    // Profile data cache for enriched profiles
    this.profileCache = new NodeCache({
      stdTTL: 3600, // 1 hour for profile data
      checkperiod: defaultConfig.checkperiod,
      maxKeys: 2000
    });
  }

  // Optimized connection search with caching and indexing
  async optimizedConnectionSearch(query: {
    targetName?: string;
    targetCompany?: string;
    targetTitle?: string;
    userId?: string;
  }): Promise<{ results: any[]; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    const optimizations: string[] = [];
    let cacheHit = false;

    // Generate cache key
    const cacheKey = this.generateCacheKey('connection_search', query);
    
    // Check cache first
    const cachedResult = this.queryCache.get(cacheKey);
    if (cachedResult) {
      cacheHit = true;
      optimizations.push('cache_hit');
      
      const metrics: PerformanceMetrics = {
        queryTime: Date.now() - startTime,
        resultCount: (cachedResult as any[]).length,
        cacheHit,
        optimizationApplied: optimizations
      };

      this.recordMetrics('connection_search', metrics);
      return { results: cachedResult as any[], metrics };
    }

    // Build optimized query
    let whereConditions: any[] = [];
    
    if (query.targetName) {
      whereConditions.push(sql`${persons.name} ILIKE ${`%${query.targetName}%`}`);
      optimizations.push('name_index_scan');
    }
    
    if (query.targetCompany) {
      whereConditions.push(sql`${persons.company} ILIKE ${`%${query.targetCompany}%`}`);
      optimizations.push('company_index_scan');
    }
    
    if (query.targetTitle) {
      whereConditions.push(sql`${persons.title} ILIKE ${`%${query.targetTitle}%`}`);
      optimizations.push('title_index_scan');
    }

    // Execute optimized query with LIMIT for performance
    const results = await db
      .select({
        id: persons.id,
        name: persons.name,
        company: persons.company,
        title: persons.title,
        location: persons.location,
        industry: persons.industry
      })
      .from(persons)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(100)
      .orderBy(persons.name);

    optimizations.push('result_limiting');

    // Cache the results
    this.queryCache.set(cacheKey, results);
    optimizations.push('result_cached');

    const metrics: PerformanceMetrics = {
      queryTime: Date.now() - startTime,
      resultCount: results.length,
      cacheHit,
      optimizationApplied: optimizations
    };

    this.recordMetrics('connection_search', metrics);
    return { results, metrics };
  }

  // Optimized pathfinding with memoization
  async optimizedPathfinding(fromPersonId: string, toPersonId: string): Promise<{
    paths: any[];
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const optimizations: string[] = [];
    let cacheHit = false;

    const cacheKey = this.generateCacheKey('pathfinding', { fromPersonId, toPersonId });
    
    // Check connection cache
    const cachedPaths = this.connectionCache.get(cacheKey);
    if (cachedPaths) {
      cacheHit = true;
      optimizations.push('path_cache_hit');
      
      const metrics: PerformanceMetrics = {
        queryTime: Date.now() - startTime,
        resultCount: (cachedPaths as any[]).length,
        cacheHit,
        optimizationApplied: optimizations
      };

      return { paths: cachedPaths as any[], metrics };
    }

    // Direct connection check (1-hop)
    const directConnection = await db
      .select()
      .from(relationshipEdges)
      .where(
        and(
          eq(relationshipEdges.fromId, fromPersonId),
          eq(relationshipEdges.toId, toPersonId)
        )
      )
      .limit(1);

    if (directConnection.length > 0) {
      const paths = [{
        type: 'direct',
        hops: 1,
        path: [fromPersonId, toPersonId],
        strength: directConnection[0].confidenceScore || 50
      }];
      
      this.connectionCache.set(cacheKey, paths);
      optimizations.push('direct_connection', 'path_cached');

      const metrics: PerformanceMetrics = {
        queryTime: Date.now() - startTime,
        resultCount: paths.length,
        cacheHit,
        optimizationApplied: optimizations
      };

      return { paths, metrics };
    }

    // 2-hop pathfinding with optimized SQL
    const twoHopPaths = await db.execute(sql`
      SELECT DISTINCT 
        r1."fromId" as start_person,
        r1."toId" as mutual_connection,
        r2."toId" as end_person,
        (r1."confidenceScore" + r2."confidenceScore") / 2 as avg_strength
      FROM ${relationshipEdges} r1
      JOIN ${relationshipEdges} r2 ON r1."toId" = r2."fromId"
      WHERE r1."fromId" = ${fromPersonId} 
        AND r2."toId" = ${toPersonId}
      ORDER BY avg_strength DESC
      LIMIT 10
    `);

    const pathRows = (twoHopPaths as any).rows || [];
    const paths = pathRows.map((row: any) => ({
      type: '2-hop',
      hops: 2,
      path: [row.start_person, row.mutual_connection, row.end_person],
      strength: row.avg_strength || 40
    }));

    this.connectionCache.set(cacheKey, paths);
    optimizations.push('2hop_optimized_sql', 'path_cached');

    const metrics: PerformanceMetrics = {
      queryTime: Date.now() - startTime,
      resultCount: paths.length,
      cacheHit,
      optimizationApplied: optimizations
    };

    return { paths, metrics };
  }

  // Batch operations for improved performance
  async batchProfileLookup(personIds: string[]): Promise<{
    profiles: Map<string, any>;
    metrics: PerformanceMetrics;
  }> {
    const startTime = Date.now();
    const optimizations: string[] = [];
    const profiles = new Map<string, any>();
    const uncachedIds: string[] = [];

    // Check cache for each profile
    for (const personId of personIds) {
      const cached = this.profileCache.get(personId);
      if (cached) {
        profiles.set(personId, cached);
        optimizations.push('profile_cache_hit');
      } else {
        uncachedIds.push(personId);
      }
    }

    // Batch fetch uncached profiles
    if (uncachedIds.length > 0) {
      const batchResults = await db
        .select()
        .from(persons)
        .where(sql`${persons.id} = ANY(${uncachedIds})`);

      optimizations.push('batch_sql_query');

      // Cache and store results
      for (const profile of batchResults) {
        this.profileCache.set(profile.id, profile);
        profiles.set(profile.id, profile);
        optimizations.push('profile_cached');
      }
    }

    const metrics: PerformanceMetrics = {
      queryTime: Date.now() - startTime,
      resultCount: profiles.size,
      cacheHit: uncachedIds.length === 0,
      optimizationApplied: optimizations
    };

    this.recordMetrics('batch_profile_lookup', metrics);
    return { profiles, metrics };
  }

  // Database connection pooling optimization
  async optimizeConnectionPool(): Promise<{
    status: string;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    // Check current connection usage
    const connectionStats = await db.execute(sql`
      SELECT 
        state,
        COUNT(*) as connection_count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `);

    const statsRows = (connectionStats as any).rows || [];
    const activeConnections = statsRows.find((row: any) => row.state === 'active')?.connection_count || 0;
    const idleConnections = statsRows.find((row: any) => row.state === 'idle')?.connection_count || 0;

    if (activeConnections > 10) {
      recommendations.push('Consider increasing connection pool size');
    }

    if (idleConnections > 20) {
      recommendations.push('Consider reducing connection pool timeout');
    }

    // Check for long-running queries
    const longRunningQueries = await db.execute(sql`
      SELECT COUNT(*) as long_queries
      FROM pg_stat_activity 
      WHERE state = 'active' 
        AND now() - query_start > interval '30 seconds'
    `);

    const queryRows = (longRunningQueries as any).rows || [];
    const longQueries = queryRows[0]?.long_queries || 0;
    if (longQueries > 0) {
      recommendations.push(`Found ${longQueries} long-running queries - consider optimization`);
    }

    return {
      status: 'optimization_complete',
      recommendations
    };
  }

  // Query performance analysis
  async analyzeQueryPerformance(): Promise<{
    slowQueries: any[];
    indexRecommendations: string[];
    performanceScore: number;
  }> {
    // Analyze slow queries
    const slowQueries = await db.execute(sql`
      SELECT 
        query,
        mean_exec_time,
        calls,
        total_exec_time
      FROM pg_stat_statements 
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    // Generate index recommendations
    const indexRecommendations: string[] = [];
    
    // Check for sequential scans on large tables
    const tableScans = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan
      FROM pg_stat_user_tables 
      WHERE seq_scan > idx_scan 
        AND seq_tup_read > 10000
    `);

    const scanRows = (tableScans as any).rows || [];
    for (const scan of scanRows) {
      indexRecommendations.push(
        `Consider adding index to ${scan.tablename} - high sequential scan ratio`
      );
    }

    // Calculate performance score (0-100)
    const avgQueryTime = this.calculateAverageQueryTime();
    const cacheHitRate = this.calculateCacheHitRate();
    const performanceScore = Math.max(0, 100 - (avgQueryTime / 10) + (cacheHitRate * 20));

    const slowQueryRows = (slowQueries as any).rows || [];
    return {
      slowQueries: slowQueryRows,
      indexRecommendations,
      performanceScore: Math.round(performanceScore)
    };
  }

  // Memory usage optimization
  optimizeMemoryUsage(): {
    cacheStats: any;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Get cache statistics
    const queryCacheStats = this.queryCache.getStats();
    const connectionCacheStats = this.connectionCache.getStats();
    const profileCacheStats = this.profileCache.getStats();

    const cacheStats = {
      queryCache: {
        keys: queryCacheStats.keys,
        hits: queryCacheStats.hits,
        misses: queryCacheStats.misses,
        hitRate: queryCacheStats.hits / (queryCacheStats.hits + queryCacheStats.misses)
      },
      connectionCache: {
        keys: connectionCacheStats.keys,
        hits: connectionCacheStats.hits,
        misses: connectionCacheStats.misses,
        hitRate: connectionCacheStats.hits / (connectionCacheStats.hits + connectionCacheStats.misses)
      },
      profileCache: {
        keys: profileCacheStats.keys,
        hits: profileCacheStats.hits,
        misses: profileCacheStats.misses,
        hitRate: profileCacheStats.hits / (profileCacheStats.hits + profileCacheStats.misses)
      }
    };

    // Generate recommendations based on cache performance
    if (cacheStats.queryCache.hitRate < 0.5) {
      recommendations.push('Query cache hit rate is low - consider increasing TTL');
    }

    if (cacheStats.connectionCache.hitRate < 0.3) {
      recommendations.push('Connection cache hit rate is low - review pathfinding patterns');
    }

    // Clear stale entries if cache is getting full
    if (queryCacheStats.keys > 800) {
      this.queryCache.flushAll();
      recommendations.push('Query cache cleared due to high memory usage');
    }

    return { cacheStats, recommendations };
  }

  // Utility methods
  private generateCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  private recordMetrics(operation: string, metrics: PerformanceMetrics) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const operationMetrics = this.performanceMetrics.get(operation)!;
    operationMetrics.push(metrics);
    
    // Keep only last 100 metrics per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }
  }

  private calculateAverageQueryTime(): number {
    let totalTime = 0;
    let totalQueries = 0;

    for (const metrics of Array.from(this.performanceMetrics.values())) {
      for (const metric of metrics) {
        totalTime += metric.queryTime;
        totalQueries++;
      }
    }

    return totalQueries > 0 ? totalTime / totalQueries : 0;
  }

  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalQueries = 0;

    for (const metrics of Array.from(this.performanceMetrics.values())) {
      for (const metric of metrics) {
        if (metric.cacheHit) totalHits++;
        totalQueries++;
      }
    }

    return totalQueries > 0 ? totalHits / totalQueries : 0;
  }

  // Real-time performance monitoring
  getPerformanceReport(): {
    summary: any;
    recentMetrics: any;
    recommendations: string[];
  } {
    const summary = {
      averageQueryTime: this.calculateAverageQueryTime(),
      cacheHitRate: this.calculateCacheHitRate(),
      totalOperations: Array.from(this.performanceMetrics.values())
        .reduce((sum, metrics) => sum + metrics.length, 0)
    };

    const recentMetrics = Array.from(this.performanceMetrics.entries()).map(([operation, metrics]) => ({
      operation,
      recentQueries: metrics.slice(-10),
      averageTime: metrics.reduce((sum, m) => sum + m.queryTime, 0) / metrics.length
    }));

    const recommendations: string[] = [];
    
    if (summary.averageQueryTime > 100) {
      recommendations.push('Average query time is high - consider optimization');
    }
    
    if (summary.cacheHitRate < 0.4) {
      recommendations.push('Cache hit rate is low - review caching strategy');
    }

    return { summary, recentMetrics, recommendations };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.queryCache.flushAll();
    this.connectionCache.flushAll();
    this.profileCache.flushAll();
  }
}

export const performanceOptimization = new PerformanceOptimization();