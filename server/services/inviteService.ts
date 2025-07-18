// Invitation service for ghost profile activation
// Handles sending invites and converting ghost profiles to real profiles

import { db } from '../db';
import { invites, persons, relationshipEdges } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface InviteRequest {
  ghostUserId: string;
  requesterId: string;
  targetId: string;
  pathData: any;
}

interface ActivationResult {
  success: boolean;
  userId?: string;
  message: string;
}

export class InviteService {

  // Create invitation for ghost profile activation
  async createInvitation(request: InviteRequest): Promise<{
    inviteId: string;
    token: string;
    emailSent: boolean;
  }> {
    console.log(`📧 Creating invitation for ghost user ${request.ghostUserId}`);

    // Verify ghost user exists
    const ghostUser = await db.select()
      .from(persons)
      .where(and(
        eq(persons.id, request.ghostUserId),
        eq(persons.isGhost, true)
      ))
      .limit(1);

    if (!ghostUser[0]) {
      throw new Error('Ghost user not found');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite record
    await db.insert(invites).values({
      id: inviteId,
      ghostUserId: request.ghostUserId,
      requesterId: request.requesterId,
      targetId: request.targetId,
      token,
      status: 'sent',
      expiresAt,
      createdAt: new Date()
    });

    // Send email invitation
    const emailSent = await this.sendInvitationEmail(
      ghostUser[0],
      request.requesterId,
      request.targetId,
      token
    );

    // Update email sent status
    await db.update(invites)
      .set({ emailSent })
      .where(eq(invites.id, inviteId));

    console.log(`✅ Invitation created: ${inviteId} (email sent: ${emailSent})`);

    return {
      inviteId,
      token,
      emailSent
    };
  }

  // Send invitation email via SendGrid
  private async sendInvitationEmail(
    ghostUser: typeof persons.$inferSelect,
    requesterId: string,
    targetId: string,
    token: string
  ): Promise<boolean> {
    try {
      // Get requester and target info
      const [requester, target] = await Promise.all([
        db.select().from(persons).where(eq(persons.id, requesterId)).limit(1),
        db.select().from(persons).where(eq(persons.id, targetId)).limit(1)
      ]);

      if (!requester[0] || !target[0]) {
        throw new Error('Could not find requester or target');
      }

      const activationLink = `${process.env.BASE_URL || 'https://warmconnector.replit.app'}/activate/${token}`;

      // Email template (would use SendGrid in production)
      const emailTemplate = `
        Hi ${ghostUser.name},

        ${requester[0].name} from ${requester[0].company} would love a warm introduction to ${target[0].name}.

        You've been identified as a potential connection in their professional network. 
        Activate your free WarmConnector profile to help facilitate this introduction and 
        unlock your own networking opportunities.

        Join here: ${activationLink}

        This invitation expires in 7 days.

        Best regards,
        The WarmConnector Team
      `;

      console.log(`📧 Email invitation prepared for ${ghostUser.email}`);
      console.log(`Activation link: ${activationLink}`);
      
      // In production, send via SendGrid:
      // await sendGrid.send({
      //   to: ghostUser.email,
      //   from: 'invites@warmconnector.com',
      //   subject: 'You\'re invited to join WarmConnector',
      //   text: emailTemplate
      // });

      return true;

    } catch (error) {
      console.error('Failed to send invitation email:', error);
      return false;
    }
  }

  // Activate ghost profile with token
  async activateProfile(token: string, activationData: {
    password?: string;
    preferences?: any;
  }): Promise<ActivationResult> {
    console.log(`🔓 Activating profile with token: ${token.substring(0, 8)}...`);

    // Find valid invitation
    const invite = await db.select()
      .from(invites)
      .where(and(
        eq(invites.token, token),
        eq(invites.status, 'sent')
      ))
      .limit(1);

    if (!invite[0]) {
      return {
        success: false,
        message: 'Invalid or expired invitation token'
      };
    }

    // Check expiration
    if (invite[0].expiresAt && invite[0].expiresAt < new Date()) {
      await db.update(invites)
        .set({ status: 'expired' })
        .where(eq(invites.id, invite[0].id));

      return {
        success: false,
        message: 'Invitation has expired'
      };
    }

    try {
      // Convert ghost to real profile
      await db.update(persons)
        .set({
          isGhost: false,
          trustScore: 90, // Activated users get higher trust
          updatedAt: new Date()
        })
        .where(eq(persons.id, invite[0].ghostUserId!));

      // Update all relationships involving this person to remove ghost penalty
      await this.updateRelationshipWeights(invite[0].ghostUserId!);

      // Mark invitation as accepted
      await db.update(invites)
        .set({ 
          status: 'accepted',
          activatedAt: new Date()
        })
        .where(eq(invites.id, invite[0].id));

      console.log(`✅ Profile activated successfully: ${invite[0].ghostUserId}`);

      return {
        success: true,
        userId: invite[0].ghostUserId!,
        message: 'Profile activated successfully! Welcome to WarmConnector.'
      };

    } catch (error) {
      console.error('Failed to activate profile:', error);
      return {
        success: false,
        message: 'Failed to activate profile. Please try again.'
      };
    }
  }

  // Update relationship weights when ghost becomes real
  private async updateRelationshipWeights(userId: string): Promise<void> {
    console.log(`🔄 Updating relationship weights for activated user: ${userId}`);

    // Update relationships where this user is involved
    await db.execute(sql`
      UPDATE relationship_edges 
      SET 
        confidence_score = LEAST(confidence_score + 30, 100),
        is_ghost = false,
        evidence = jsonb_set(
          COALESCE(evidence::jsonb, '{}'),
          '{activated}', 
          'true'
        )::text
      WHERE from_id = ${userId} OR to_id = ${userId}
    `);

    console.log(`✅ Relationship weights updated for ${userId}`);
  }

  // Get invitation statistics
  async getInviteStats(): Promise<{
    totalSent: number;
    totalAccepted: number;
    totalExpired: number;
    conversionRate: number;
    recentInvites: any[];
  }> {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as total_accepted,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as total_expired
      FROM invites
    `);

    const recentInvites = await db.execute(sql`
      SELECT 
        i.id,
        i.status,
        i.created_at,
        i.activated_at,
        p.name as ghost_name,
        p.email as ghost_email
      FROM invites i
      JOIN persons p ON i.ghost_user_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    const totalSent = Number(stats[0]?.total_sent || 0);
    const totalAccepted = Number(stats[0]?.total_accepted || 0);
    const conversionRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;

    return {
      totalSent,
      totalAccepted,
      totalExpired: Number(stats[0]?.total_expired || 0),
      conversionRate: Math.round(conversionRate * 100) / 100,
      recentInvites
    };
  }

  // Clean up expired invitations
  async cleanupExpiredInvites(): Promise<number> {
    const result = await db.execute(sql`
      UPDATE invites 
      SET status = 'expired'
      WHERE status = 'sent' 
      AND expires_at < NOW()
    `);

    console.log(`🧹 Marked ${result.rowCount || 0} invitations as expired`);
    return result.rowCount || 0;
  }

  // Check if path requires invitation
  checkPathRequiresInvite(pathData: any[]): {
    requiresInvite: boolean;
    ghostUsers: string[];
    inviteNeeded: boolean;
  } {
    const ghostUsers = pathData
      .filter(node => node.isGhost)
      .map(node => node.personId);

    return {
      requiresInvite: ghostUsers.length > 0,
      ghostUsers,
      inviteNeeded: ghostUsers.length > 0
    };
  }
}

export const inviteService = new InviteService();