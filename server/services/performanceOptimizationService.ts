// Performance optimization service for handling millions of relationships
// Implements caching, indexing, and query optimization strategies

import { db } from '../db';
import { persons, relationships, connectionPaths, externalDataSources } from '@shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

interface QueryPerformanceMetrics {
  queryType: string;
  executionTime: number;
  recordsProcessed: number;
  cacheHit: boolean;
}

interface ConnectionCache {
  fromPersonId: string;
  toPersonId: string;
  path: any[];
  strength: number;
  hops: number;
  cachedAt: Date;
  expiresAt: Date;
}

export class PerformanceOptimizationService {
  private queryCache = new Map<string, any>();
  private cacheExpiry = 1000 * 60 * 30; // 30 minutes
  private performanceMetrics: QueryPerformanceMetrics[] = [];

  // Optimize database with proper indexes
  async createOptimalIndexes(): Promise<void> {
    console.log('Creating performance indexes...');

    const indexes = [
      // Person lookup indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_company ON persons(company)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_email ON persons(email)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_name ON persons USING gin(to_tsvector('english', name))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_title ON persons USING gin(to_tsvector('english', title))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_location ON persons(location)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_source ON persons(source)`,

      // Relationship lookup indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_from_person ON relationships(from_person_id)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_to_person ON relationships(to_person_id)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_type ON relationships(relationship_type)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_strength ON relationships(strength DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_composite ON relationships(from_person_id, relationship_type, strength DESC)`,

      // Connection paths cache indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_paths_from ON connection_paths(from_person_id)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_paths_to ON connection_paths(to_person_id)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_paths_hops ON connection_paths(hops)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connection_paths_expires ON connection_paths(expires_at)`,

      // External data source indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sources_person ON external_data_sources(person_id)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sources_type ON external_data_sources(source)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sources_hash ON external_data_sources(data_hash)`,

      // Company lookup indexes
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies USING gin(to_tsvector('english', name))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_domain ON companies(domain)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_industry ON companies(industry)`
    ];

    for (const indexQuery of indexes) {
      try {
        await db.execute(sql.raw(indexQuery));
        console.log(`✅ Created index: ${indexQuery.split(' ')[6]}`);
      } catch (error) {
        console.log(`⚠️ Index creation skipped (may already exist): ${indexQuery.split(' ')[6]}`);
      }
    }
  }

  // Optimized person search with full-text search and ranking
  async searchPersonsOptimized(query: string, limit: number = 20): Promise<any[]> {
    const cacheKey = `search_persons_${query}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    const results = await db.execute(sql`
      SELECT 
        p.*,
        ts_rank(
          to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.title, '') || ' ' || coalesce(p.company, '')),
          plainto_tsquery('english', ${query})
        ) as relevance_score
      FROM persons p
      WHERE 
        to_tsvector('english', coalesce(p.name, '') || ' ' || coalesce(p.title, '') || ' ' || coalesce(p.company, ''))
        @@ plainto_tsquery('english', ${query})
      ORDER BY relevance_score DESC, p.name
      LIMIT ${limit}
    `);

    const executionTime = Date.now() - startTime;
    this.recordMetrics('search_persons', executionTime, results.length, false);
    
    this.setCache(cacheKey, results);
    return results;
  }

  // Optimized relationship discovery with connection strength scoring
  async findConnectionsOptimized(personId: string, maxHops: number = 3): Promise<any[]> {
    const cacheKey = `connections_${personId}_${maxHops}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();

    // Use recursive CTE for efficient graph traversal
    const results = await db.execute(sql`
      WITH RECURSIVE connection_paths AS (
        -- Base case: direct connections
        SELECT 
          r.to_person_id,
          ARRAY[${personId}, r.to_person_id] as path,
          r.strength as total_strength,
          1 as hops,
          r.relationship_type
        FROM relationships r
        WHERE r.from_person_id = ${personId}
        
        UNION ALL
        
        -- Recursive case: extend paths
        SELECT 
          r.to_person_id,
          cp.path || r.to_person_id,
          LEAST(cp.total_strength, r.strength) as total_strength,
          cp.hops + 1,
          cp.relationship_type || ' -> ' || r.relationship_type
        FROM connection_paths cp
        JOIN relationships r ON r.from_person_id = cp.to_person_id
        WHERE 
          cp.hops < ${maxHops}
          AND NOT r.to_person_id = ANY(cp.path)  -- Prevent cycles
          AND cp.total_strength > 30  -- Only follow strong connections
      )
      SELECT 
        cp.*,
        p.name,
        p.company,
        p.title
      FROM connection_paths cp
      JOIN persons p ON p.id = cp.to_person_id
      WHERE cp.to_person_id != ${personId}
      ORDER BY cp.total_strength DESC, cp.hops ASC
      LIMIT 100
    `);

    const executionTime = Date.now() - startTime;
    this.recordMetrics('find_connections', executionTime, results.length, false);
    
    this.setCache(cacheKey, results);
    return results;
  }

  // Batch relationship creation for external data imports
  async batchCreateRelationships(relationships: Array<{
    fromPersonId: string;
    toPersonId: string;
    relationshipType: string;
    strength: number;
    metadata?: any;
  }>): Promise<number> {
    const startTime = Date.now();
    const batchSize = 1000;
    let totalCreated = 0;

    // Process in batches to avoid memory issues
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);
      
      try {
        // Use COPY for ultra-fast bulk inserts
        const values = batch.map(rel => 
          `('${rel.fromPersonId}', '${rel.toPersonId}', '${rel.relationshipType}', ${rel.strength}, '${JSON.stringify(rel.metadata || {})}')`
        ).join(',');

        await db.execute(sql.raw(`
          INSERT INTO relationships (from_person_id, to_person_id, relationship_type, strength, metadata)
          VALUES ${values}
          ON CONFLICT (from_person_id, to_person_id) DO NOTHING
        `));

        totalCreated += batch.length;
      } catch (error) {
        console.error(`Batch insert failed for batch ${i}-${i + batchSize}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;
    this.recordMetrics('batch_create_relationships', executionTime, totalCreated, false);
    
    return totalCreated;
  }

  // Precompute and cache common connection paths
  async precomputeConnectionPaths(personIds: string[]): Promise<number> {
    const startTime = Date.now();
    let cachedPaths = 0;

    for (const personId of personIds) {
      try {
        const connections = await this.findConnectionsOptimized(personId, 3);
        
        // Store top connections in cache table
        for (const connection of connections.slice(0, 20)) {
          try {
            await db.insert(connectionPaths).values({
              id: `path_${personId}_${connection.to_person_id}`,
              fromPersonId: personId,
              toPersonId: connection.to_person_id,
              pathData: JSON.stringify(connection.path),
              pathStrength: connection.total_strength,
              hops: connection.hops,
              lastCalculated: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });
            cachedPaths++;
          } catch (error) {
            // Path already cached, skip
          }
        }
      } catch (error) {
        console.error(`Failed to precompute paths for ${personId}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;
    this.recordMetrics('precompute_paths', executionTime, cachedPaths, false);

    return cachedPaths;
  }

  // Clean up expired cache entries
  async cleanupExpiredCache(): Promise<number> {
    const result = await db.execute(sql`
      DELETE FROM connection_paths 
      WHERE expires_at < NOW()
    `);

    // Clean in-memory cache
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (value.expiresAt < now) {
        this.queryCache.delete(key);
      }
    }

    return result.rowCount || 0;
  }

  // Database health check and optimization recommendations
  async analyzePerformance(): Promise<{
    tableStats: any[];
    indexUsage: any[];
    slowQueries: QueryPerformanceMetrics[];
    recommendations: string[];
  }> {
    // Get table statistics
    const tableStats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `);

    // Get index usage statistics
    const indexUsage = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `);

    // Analyze query performance
    const slowQueries = this.performanceMetrics
      .filter(m => m.executionTime > 1000) // Queries over 1 second
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} slow queries detected. Consider adding indexes or optimizing queries.`);
    }

    const totalRows = tableStats.reduce((sum: number, table: any) => sum + (table.live_rows || 0), 0);
    if (totalRows > 1000000) {
      recommendations.push('Large dataset detected. Consider partitioning tables or implementing archival strategy.');
    }

    const deadRows = tableStats.reduce((sum: number, table: any) => sum + (table.dead_rows || 0), 0);
    if (deadRows > totalRows * 0.1) {
      recommendations.push('High dead row count. Run VACUUM ANALYZE to reclaim space.');
    }

    return {
      tableStats,
      indexUsage,
      slowQueries,
      recommendations
    };
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.queryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.queryCache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheExpiry
    });
  }

  private recordMetrics(queryType: string, executionTime: number, recordsProcessed: number, cacheHit: boolean): void {
    this.performanceMetrics.push({
      queryType,
      executionTime,
      recordsProcessed,
      cacheHit
    });

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.splice(0, 100);
    }
  }

  // Get performance statistics
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: number;
  } {
    const metrics = this.performanceMetrics;
    
    return {
      totalQueries: metrics.length,
      averageExecutionTime: metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length || 0,
      cacheHitRate: (metrics.filter(m => m.cacheHit).length / metrics.length) * 100 || 0,
      slowQueries: metrics.filter(m => m.executionTime > 1000).length
    };
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();