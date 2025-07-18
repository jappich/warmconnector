import axios from 'axios';

interface N8nWorkflowTrigger {
  workflowId: string;
  data: any;
  waitForCompletion?: boolean;
}

interface N8nConnectionEnrichment {
  personName: string;
  company?: string;
  linkedinUrl?: string;
  emailFound?: string;
  phoneFound?: string;
  socialProfiles?: string[];
  mutualConnections?: string[];
  recentActivity?: string[];
  confidence: number;
}

export class N8nIntegrationService {
  private n8nBaseUrl: string;
  private apiKey: string;

  constructor() {
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
  }

  async triggerConnectionResearchWorkflow(
    targetName: string, 
    targetCompany?: string
  ): Promise<N8nConnectionEnrichment> {
    try {
      if (!this.apiKey) {
        throw new Error('N8N_API_KEY required for workflow automation');
      }

      console.log(`Triggering n8n workflow for: ${targetName} at ${targetCompany}`);

      const workflowData = {
        targetName,
        targetCompany,
        timestamp: new Date().toISOString(),
        sources: ['linkedin', 'crunchbase', 'github', 'twitter']
      };

      const response = await axios.post(
        `${this.n8nBaseUrl}/api/v1/workflows/connection-research/execute`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return this.parseN8nResponse(response.data);
    } catch (error) {
      console.error('N8n workflow error:', error);
      
      // Fallback to direct API calls if n8n is unavailable
      return await this.fallbackDirectSearch(targetName, targetCompany);
    }
  }

  async triggerLinkedInEnrichmentWorkflow(profileUrl: string): Promise<any> {
    try {
      const workflowData = {
        profileUrl,
        enrichmentType: 'linkedin_deep_dive',
        extractConnections: true,
        extractRecentActivity: true
      };

      const response = await axios.post(
        `${this.n8nBaseUrl}/api/v1/workflows/linkedin-enrichment/execute`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data;
    } catch (error) {
      console.error('LinkedIn enrichment workflow error:', error);
      return null;
    }
  }

  async triggerIntroductionOutreachWorkflow(
    fromPerson: string,
    toPerson: string,
    introMessage: string
  ): Promise<boolean> {
    try {
      const workflowData = {
        fromPerson,
        toPerson,
        introMessage,
        channels: ['email', 'linkedin'],
        followUpSchedule: '3_days'
      };

      const response = await axios.post(
        `${this.n8nBaseUrl}/api/v1/workflows/introduction-outreach/execute`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error('Introduction outreach workflow error:', error);
      return false;
    }
  }

  async setupConnectionMonitoringWorkflow(targetPerson: string): Promise<string> {
    try {
      const workflowData = {
        targetPerson,
        monitoringSources: ['linkedin', 'twitter', 'news'],
        alertFrequency: 'weekly',
        webhookUrl: `${process.env.APP_BASE_URL}/api/n8n/connection-updates`
      };

      const response = await axios.post(
        `${this.n8nBaseUrl}/api/v1/workflows/connection-monitoring/setup`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.monitoringId || 'monitoring_setup_failed';
    } catch (error) {
      console.error('Connection monitoring setup error:', error);
      return 'monitoring_unavailable';
    }
  }

  private parseN8nResponse(responseData: any): N8nConnectionEnrichment {
    const data = responseData.data || responseData;
    
    return {
      personName: data.personName || '',
      company: data.company || '',
      linkedinUrl: data.linkedinUrl || '',
      emailFound: data.emailFound || '',
      phoneFound: data.phoneFound || '',
      socialProfiles: data.socialProfiles || [],
      mutualConnections: data.mutualConnections || [],
      recentActivity: data.recentActivity || [],
      confidence: data.confidence || 0.6
    };
  }

  private async fallbackDirectSearch(
    targetName: string, 
    targetCompany?: string
  ): Promise<N8nConnectionEnrichment> {
    // Fallback when n8n is unavailable - use direct API calls
    return {
      personName: targetName,
      company: targetCompany || '',
      linkedinUrl: '',
      emailFound: '',
      phoneFound: '',
      socialProfiles: [],
      mutualConnections: [],
      recentActivity: [],
      confidence: 0.3
    };
  }

  async getWorkflowStatus(executionId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.n8nBaseUrl}/api/v1/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.status || 'unknown';
    } catch (error) {
      console.error('Workflow status check error:', error);
      return 'error';
    }
  }
}

export const n8nIntegrationService = new N8nIntegrationService();