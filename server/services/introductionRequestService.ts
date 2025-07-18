import { db } from '../db.js';
import { introductionRequests } from '../../shared/schema.js';
import sgMail from '@sendgrid/mail';
import { eq, and, desc } from 'drizzle-orm';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface IntroductionRequestData {
  requesterId: string;
  connectorId: string;
  targetId: string;
  message: string;
  path: Array<{
    id: string;
    name: string;
    title?: string;
    company?: string;
  }>;
}

export interface IntroductionRequest {
  id: string;
  requesterId: string;
  connectorId: string;
  targetId: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: Date;
  pathData?: any;
}

export class IntroductionRequestService {
  
  async createRequest(data: IntroductionRequestData): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Generate a unique ID for the request
      const requestId = `intro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the request in database (simplified for demo)
      const request = {
        id: requestId,
        requesterId: data.requesterId,
        connectorId: data.connectorId,
        targetId: data.targetId,
        message: data.message,
        status: 'pending' as const,
        pathData: JSON.stringify(data.path),
        timestamp: new Date()
      };

      // Send email notification
      const emailSent = await this.sendIntroductionEmail(data, requestId);
      
      if (emailSent) {
        return { success: true, requestId };
      } else {
        return { success: false, error: 'Failed to send email notification' };
      }
      
    } catch (error) {
      console.error('Error creating introduction request:', error);
      return { success: false, error: 'Database error' };
    }
  }

  async sendIntroductionEmail(data: IntroductionRequestData, requestId: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, skipping email');
      return false;
    }

    try {
      const connector = data.path.find(p => p.id === data.connectorId);
      const target = data.path.find(p => p.id === data.targetId);
      const requester = data.path.find(p => p.id === data.requesterId);

      if (!connector || !target || !requester) {
        console.error('Missing person data for email');
        return false;
      }

      // Create email template
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Introduction Request</h2>
          
          <p>Hi ${connector.name},</p>
          
          <p><strong>${requester.name}</strong> would like you to introduce them to <strong>${target.name}</strong>.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Their message:</h3>
            <p style="font-style: italic;">"${data.message}"</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #059669;">Connection Path:</h4>
            <p>${data.path.map(p => `${p.name}${p.title ? ` (${p.title})` : ''}`).join(' → ')}</p>
          </div>
          
          <p>You can:</p>
          <ul>
            <li>Reply to this email with your response</li>
            <li>Make the introduction if you're comfortable</li>
            <li>Politely decline if you prefer not to</li>
          </ul>
          
          <p>Best regards,<br>WarmConnector Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Request ID: ${requestId}<br>
            This email was sent through WarmConnector's introduction request system.
          </p>
        </div>
      `;

      const msg = {
        to: `${connector.name.toLowerCase().replace(' ', '.')}@example.com`, // Would use real email lookup
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@warmconnector.com',
        subject: `Introduction Request: ${requester.name} → ${target.name}`,
        html: emailHtml,
        text: `
          Hi ${connector.name},
          
          ${requester.name} would like you to introduce them to ${target.name}.
          
          Their message: "${data.message}"
          
          Connection Path: ${data.path.map(p => p.name).join(' → ')}
          
          Best regards,
          WarmConnector Team
          
          Request ID: ${requestId}
        `
      };

      await sgMail.send(msg);
      console.log('Introduction email sent successfully');
      return true;
      
    } catch (error) {
      console.error('Error sending introduction email:', error);
      return false;
    }
  }

  async getRequestsByUser(userId: string): Promise<IntroductionRequest[]> {
    try {
      const requests = await db.select()
        .from(introductionRequests)
        .where(eq(introductionRequests.requesterId, userId))
        .orderBy(desc(introductionRequests.timestamp));
      
      return requests.map(req => ({
        id: req.id,
        requesterId: req.requesterId,
        connectorId: req.connectorId,
        targetId: req.targetId,
        message: req.message,
        status: req.status as 'pending' | 'sent' | 'failed',
        timestamp: req.timestamp,
        pathData: req.pathData ? JSON.parse(req.pathData) : null
      }));
      
    } catch (error) {
      console.error('Error getting requests by user:', error);
      return [];
    }
  }

  async getRequestStats(): Promise<{ total: number; pending: number; sent: number; failed: number }> {
    try {
      const allRequests = await db.select().from(introductionRequests);
      
      return {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        sent: allRequests.filter(r => r.status === 'sent').length,
        failed: allRequests.filter(r => r.status === 'failed').length
      };
      
    } catch (error) {
      console.error('Error getting request stats:', error);
      return { total: 0, pending: 0, sent: 0, failed: 0 };
    }
  }
}

export const introductionRequestService = new IntroductionRequestService();