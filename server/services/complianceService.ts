// GDPR/CCPA compliance service with data retention and privacy controls
// Implements data export, deletion, and privacy settings management

import { db } from '../db';
import { users, externalProfiles, relationshipEdges, pathCache } from '@shared/schema';
import { eq, lt, sql } from 'drizzle-orm';

interface UserDataExport {
  profile: any;
  relationships: any[];
  externalData: any[];
  privacySettings: any;
  exportedAt: string;
}

interface PrivacySettings {
  showEmail: boolean;
  showFamily: boolean;
  showEducation: boolean;
  showSocialProfiles: boolean;
  showHometown: boolean;
  dataRetentionDays: number;
}

export class ComplianceService {

  // GDPR Export - Get all user data
  async exportUserData(userId: number): Promise<UserDataExport> {
    console.log(`📋 Exporting data for user ${userId}`);

    // Get user profile
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      throw new Error('User not found');
    }

    // Get user's relationships
    const relationships = await db.execute(sql`
      SELECT 
        re.type,
        re.confidence_score,
        re.evidence,
        re.created_at,
        p.name as connected_person_name,
        p.company as connected_person_company
      FROM relationship_edges re
      JOIN persons p ON (p.id = re.to_id OR p.id = re.from_id)
      WHERE re.from_id = ${user[0].oktaId} 
         OR re.to_id = ${user[0].oktaId}
    `);

    // Get external data sources
    const externalData = await db.select()
      .from(externalProfiles)
      .where(eq(externalProfiles.userId, userId));

    return {
      profile: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        title: user[0].title,
        socialProfiles: user[0].socialProfiles,
        education: user[0].education,
        family: user[0].family,
        greekLife: user[0].greekLife,
        hometowns: user[0].hometowns,
        createdAt: user[0].createdAt,
        updatedAt: user[0].updatedAt
      },
      relationships: relationships.map(rel => ({
        type: rel.type,
        confidence: rel.confidence_score,
        connectedTo: rel.connected_person_name,
        company: rel.connected_person_company,
        createdAt: rel.created_at,
        evidence: rel.evidence ? JSON.parse(rel.evidence as string) : null
      })),
      externalData: externalData.map(ext => ({
        source: ext.source,
        importedAt: ext.importedAt,
        // Don't include raw API data for privacy
        hasData: !!ext.rawJson
      })),
      privacySettings: user[0].privacySettings,
      exportedAt: new Date().toISOString()
    };
  }

  // GDPR Deletion - Remove all user data
  async deleteUserData(userId: number): Promise<{
    deletedRecords: {
      profile: number;
      relationships: number;
      externalData: number;
      pathCache: number;
    };
  }> {
    console.log(`🗑️ Deleting all data for user ${userId}`);

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      throw new Error('User not found');
    }

    const oktaId = user[0].oktaId;

    // Delete relationships
    const deletedRelationships = await db.execute(sql`
      DELETE FROM relationship_edges 
      WHERE from_id = ${oktaId} OR to_id = ${oktaId}
    `);

    // Delete external profiles
    const deletedExternal = await db.execute(sql`
      DELETE FROM external_profiles 
      WHERE user_id = ${userId}
    `);

    // Delete path cache entries
    const deletedPaths = await db.execute(sql`
      DELETE FROM path_cache 
      WHERE start_id = ${oktaId} OR end_id = ${oktaId}
    `);

    // Delete user profile (cascade will handle other tables)
    const deletedProfile = await db.execute(sql`
      DELETE FROM users 
      WHERE id = ${userId}
    `);

    return {
      deletedRecords: {
        profile: deletedProfile.rowCount || 0,
        relationships: deletedRelationships.rowCount || 0,
        externalData: deletedExternal.rowCount || 0,
        pathCache: deletedPaths.rowCount || 0
      }
    };
  }

  // Update privacy settings
  async updatePrivacySettings(userId: number, settings: Partial<PrivacySettings>): Promise<void> {
    console.log(`🔒 Updating privacy settings for user ${userId}`);

    const currentUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser[0]) {
      throw new Error('User not found');
    }

    const currentSettings = currentUser[0].privacySettings as any || {};
    const updatedSettings = { ...currentSettings, ...settings };

    await db.update(users)
      .set({ 
        privacySettings: updatedSettings,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Data retention cleanup - Delete old external data
  async cleanupExpiredData(): Promise<{
    deletedProfiles: number;
    deletedPaths: number;
  }> {
    console.log('🧹 Running data retention cleanup...');

    // Default retention: 2 years (730 days)
    const cutoffDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);

    // Delete old external profiles
    const deletedProfiles = await db.execute(sql`
      DELETE FROM external_profiles
      WHERE imported_at < ${cutoffDate}
    `);

    // Delete expired path cache
    const deletedPaths = await db.execute(sql`
      DELETE FROM path_cache
      WHERE ttl < NOW()
    `);

    const result = {
      deletedProfiles: deletedProfiles.rowCount || 0,
      deletedPaths: deletedPaths.rowCount || 0
    };

    console.log(`✅ Cleanup complete:`, result);
    return result;
  }

  // Check if user has opted out of data collection
  async isDataCollectionAllowed(userId: number, dataType: keyof PrivacySettings): Promise<boolean> {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) return false;

    const settings = user[0].privacySettings as PrivacySettings || {};
    
    // Default to true if setting not specified
    return settings[dataType] !== false;
  }

  // Anonymize user data instead of deletion (for compliance options)
  async anonymizeUserData(userId: number): Promise<void> {
    console.log(`🎭 Anonymizing data for user ${userId}`);

    const anonymizedEmail = `deleted_user_${userId}@anonymized.local`;
    const anonymizedName = `[Deleted User ${userId}]`;

    await db.update(users)
      .set({
        email: anonymizedEmail,
        name: anonymizedName,
        oktaId: null,
        title: '[Anonymized]',
        socialProfiles: null,
        education: null,
        family: null,
        greekLife: null,
        hometowns: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Clear external profile raw data but keep relationships for network integrity
    await db.update(externalProfiles)
      .set({
        rawJson: '{"anonymized": true}',
        externalId: `anon_${userId}`
      })
      .where(eq(externalProfiles.userId, userId));
  }

  // Get compliance status for admin dashboard
  async getComplianceStatus(): Promise<{
    totalUsers: number;
    usersWithPrivacySettings: number;
    expiredDataCount: number;
    recentExports: number;
    recentDeletions: number;
  }> {
    const cutoffDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, usersWithSettings, expiredData] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM users`),
      db.execute(sql`SELECT COUNT(*) as count FROM users WHERE privacy_settings IS NOT NULL`),
      db.execute(sql`SELECT COUNT(*) as count FROM external_profiles WHERE imported_at < ${cutoffDate}`)
    ]);

    return {
      totalUsers: Number(totalUsers[0]?.count || 0),
      usersWithPrivacySettings: Number(usersWithSettings[0]?.count || 0),
      expiredDataCount: Number(expiredData[0]?.count || 0),
      recentExports: 0, // Would track in audit log
      recentDeletions: 0 // Would track in audit log
    };
  }

  // Validate compliance before API data import
  async validateDataImport(userId: number, dataType: string, source: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return { allowed: false, reason: 'User not found' };
    }

    const settings = user[0].privacySettings as PrivacySettings || {};

    // Check specific data type permissions
    switch (dataType) {
      case 'email':
        if (!settings.showEmail) {
          return { allowed: false, reason: 'User has opted out of email data collection' };
        }
        break;
      case 'family':
        if (!settings.showFamily) {
          return { allowed: false, reason: 'User has opted out of family data collection' };
        }
        break;
      case 'education':
        if (!settings.showEducation) {
          return { allowed: false, reason: 'User has opted out of education data collection' };
        }
        break;
      case 'social':
        if (!settings.showSocialProfiles) {
          return { allowed: false, reason: 'User has opted out of social profile data collection' };
        }
        break;
    }

    return { allowed: true };
  }
}

export const complianceService = new ComplianceService();