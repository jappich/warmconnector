import { db } from './db';
import { sql } from 'drizzle-orm';

export interface PathNode {
  id: string;
  name: string;
  title: string;
  company: string;
}

export interface ConnectionPath {
  path: PathNode[];
  hops: number;
  totalStrength: number;
}

export class PathfindingEngine {
  private userId = 'demo-user-001';

  async findAllPaths(targetId: string): Promise<ConnectionPath[]> {
    const allPaths: ConnectionPath[] = [];

    // Single recursive query to find all paths from 1-6 hops
    const pathResults = await db.execute(sql`
      WITH RECURSIVE path_finder AS (
        -- Base case: Start from demo user
        SELECT 
          'demo-user-001' as start_id,
          r.to_person_id as current_id,
          ARRAY['demo-user-001', r.to_person_id] as path_ids,
          ARRAY[r.strength] as strengths,
          1 as hop_count,
          r.strength::float as avg_strength
        FROM relationships r
        WHERE r.from_person_id = 'demo-user-001'
        
        UNION ALL
        
        -- Recursive case: Extend paths
        SELECT 
          pf.start_id,
          r.to_person_id,
          pf.path_ids || r.to_person_id,
          pf.strengths || r.strength,
          pf.hop_count + 1,
          (array_sum(pf.strengths) + r.strength) / (pf.hop_count + 1)
        FROM path_finder pf
        JOIN relationships r ON pf.current_id = r.from_person_id
        WHERE pf.hop_count < 6
          AND r.to_person_id != ALL(pf.path_ids)  -- Prevent cycles
          AND r.to_person_id != 'demo-user-001'   -- Don't return to start
      )
      SELECT DISTINCT
        pf.path_ids,
        pf.hop_count,
        pf.avg_strength,
        -- Get all person details for the path
        array_agg(p.name ORDER BY path_idx) as names,
        array_agg(p.title ORDER BY path_idx) as titles,
        array_agg(p.company ORDER BY path_idx) as companies
      FROM path_finder pf
      CROSS JOIN unnest(pf.path_ids) WITH ORDINALITY AS u(person_id, path_idx)
      JOIN persons p ON p.id = u.person_id
      WHERE pf.current_id = ${targetId}
      GROUP BY pf.path_ids, pf.hop_count, pf.avg_strength
      ORDER BY pf.hop_count ASC, pf.avg_strength DESC
      LIMIT 15
    `);

    // Process results
    pathResults.rows.forEach((row: any) => {
      const pathNodes: PathNode[] = [];
      
      for (let i = 0; i < row.path_ids.length; i++) {
        pathNodes.push({
          id: row.path_ids[i],
          name: row.names[i],
          title: row.titles[i],
          company: row.companies[i]
        });
      }

      allPaths.push({
        path: pathNodes,
        hops: row.hop_count,
        totalStrength: Math.round(row.avg_strength || 60)
      });
    });

    return allPaths;
  }

  // Helper function for array sum in PostgreSQL
  private async ensureArraySumFunction() {
    try {
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION array_sum(int[]) 
        RETURNS bigint AS $$
        SELECT sum(unnest) FROM unnest($1)
        $$ LANGUAGE sql IMMUTABLE;
      `);
    } catch (e) {
      // Function might already exist
    }
  }
}