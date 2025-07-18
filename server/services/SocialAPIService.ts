import axios from 'axios';
import { connectionRepository } from '../repositories/ConnectionRepository';
import type { ConnectionEvidence, UserProfile } from '../repositories/ConnectionRepository';

interface SocialAPIMutualConnection {
  platform: string;
  type: 'mutual_connection' | 'shared_group' | 'co_contribution' | 'mutual_follower';
  evidence: string;
  confidence: number;
}

export class SocialAPIService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async findSocialConnections(userA: UserProfile, userB: UserProfile): Promise<ConnectionEvidence[]> {
    const connections: ConnectionEvidence[] = [];

    // Process each social platform
    const socialPlatforms = [
      { platform: 'linkedin', handleA: userA.linkedin, handleB: userB.linkedin },
      { platform: 'twitter', handleA: userA.twitter, handleB: userB.twitter },
      { platform: 'github', handleA: userA.github, handleB: userB.github },
      { platform: 'facebook', handleA: userA.facebook, handleB: userB.facebook },
      { platform: 'instagram', handleA: userA.instagram, handleB: userB.instagram }
    ];

    for (const { platform, handleA, handleB } of socialPlatforms) {
      if (handleA && handleB) {
        try {
          const platformConnections = await this.findPlatformConnections(
            platform, 
            handleA, 
            handleB
          );
          connections.push(...platformConnections);
        } catch (error) {
          console.error(`Error checking ${platform} connections:`, error);
        }
      }
    }

    return connections;
  }

  private async findPlatformConnections(
    platform: string, 
    handleA: string, 
    handleB: string
  ): Promise<ConnectionEvidence[]> {
    const cacheKey = `${platform}_${handleA}_${handleB}`;
    
    // Check cache first
    const cached = await connectionRepository.getCachedLookup('social_api', cacheKey);
    if (cached) {
      return this.parseConnectionResults(cached, platform);
    }

    let results: SocialAPIMutualConnection[] = [];

    switch (platform) {
      case 'linkedin':
        results = await this.checkLinkedInConnections(handleA, handleB);
        break;
      case 'twitter':
        results = await this.checkTwitterConnections(handleA, handleB);
        break;
      case 'github':
        results = await this.checkGitHubConnections(handleA, handleB);
        break;
      case 'facebook':
        results = await this.checkFacebookConnections(handleA, handleB);
        break;
      case 'instagram':
        results = await this.checkInstagramConnections(handleA, handleB);
        break;
    }

    // Cache results
    const expiresAt = new Date(Date.now() + this.CACHE_DURATION);
    await connectionRepository.cacheLookup('social_api', cacheKey, results, expiresAt);

    return this.parseConnectionResults(results, platform);
  }

  private async checkLinkedInConnections(profileA: string, profileB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];

    try {
      if (!process.env.LINKEDIN_ACCESS_TOKEN) {
        throw new Error('LinkedIn API credentials required');
      }

      // LinkedIn API v2 - Get mutual connections (requires special permissions)
      const response = await axios.get(
        `https://api.linkedin.com/v2/people/${profileA}/connections`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const connections = response.data.elements || [];
      const profileBInConnections = connections.some((conn: any) => 
        conn.profileUrl && conn.profileUrl.includes(profileB)
      );

      if (profileBInConnections) {
        results.push({
          platform: 'linkedin',
          type: 'mutual_connection',
          evidence: 'Connected on LinkedIn',
          confidence: 0.9
        });
      }

      // Check for shared groups or companies
      const sharedGroups = await this.checkLinkedInSharedGroups(profileA, profileB);
      results.push(...sharedGroups);

    } catch (error) {
      console.error('LinkedIn API error:', error);
      // Fallback to public profile analysis if API fails
      return this.checkLinkedInPublicProfiles(profileA, profileB);
    }

    return results;
  }

  private async checkLinkedInSharedGroups(profileA: string, profileB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];
    
    try {
      // This would require LinkedIn Groups API access
      // For now, return empty array as this requires special permissions
      console.log('LinkedIn Groups API would check shared groups between', profileA, profileB);
    } catch (error) {
      console.error('LinkedIn Groups API error:', error);
    }

    return results;
  }

  private async checkLinkedInPublicProfiles(profileA: string, profileB: string): Promise<SocialAPIMutualConnection[]> {
    // Fallback: Check if profiles mention similar companies/schools
    // This is a simplified version - in production you'd use proper scraping
    return [];
  }

  private async checkTwitterConnections(handleA: string, handleB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];

    try {
      if (!process.env.TWITTER_BEARER_TOKEN) {
        throw new Error('Twitter API credentials required');
      }

      // Twitter API v2 - Check mutual followers
      const responseA = await axios.get(
        `https://api.twitter.com/2/users/by/username/${handleA.replace('@', '')}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          },
          timeout: 10000
        }
      );

      const responseB = await axios.get(
        `https://api.twitter.com/2/users/by/username/${handleB.replace('@', '')}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          },
          timeout: 10000
        }
      );

      if (responseA.data.data && responseB.data.data) {
        const userAId = responseA.data.data.id;
        const userBId = responseB.data.data.id;

        // Check if they follow each other
        const followsResponse = await axios.get(
          `https://api.twitter.com/2/users/${userAId}/following/${userBId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
            },
            timeout: 10000
          }
        );

        if (followsResponse.data.data?.following) {
          results.push({
            platform: 'twitter',
            type: 'mutual_follower',
            evidence: 'Follow each other on Twitter',
            confidence: 0.8
          });
        }
      }

    } catch (error) {
      console.error('Twitter API error:', error);
    }

    return results;
  }

  private async checkGitHubConnections(handleA: string, handleB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];

    try {
      // GitHub API - Check for co-contributions, shared repos, mutual follows
      const userARepos = await axios.get(
        `https://api.github.com/users/${handleA}/repos?per_page=100`,
        { timeout: 10000 }
      );

      const userBRepos = await axios.get(
        `https://api.github.com/users/${handleB}/repos?per_page=100`,
        { timeout: 10000 }
      );

      const reposA = userARepos.data || [];
      const reposB = userBRepos.data || [];

      // Check for shared repositories
      for (const repoA of reposA) {
        for (const repoB of reposB) {
          if (repoA.name === repoB.name && repoA.full_name !== repoB.full_name) {
            results.push({
              platform: 'github',
              type: 'co_contribution',
              evidence: `Both have repositories named '${repoA.name}'`,
              confidence: 0.6
            });
          }
        }
      }

      // Check if one contributed to the other's repos
      for (const repo of reposA) {
        try {
          const contributors = await axios.get(
            `https://api.github.com/repos/${repo.full_name}/contributors`,
            { timeout: 5000 }
          );
          
          const contributorNames = contributors.data.map((c: any) => c.login);
          if (contributorNames.includes(handleB)) {
            results.push({
              platform: 'github',
              type: 'co_contribution',
              evidence: `${handleB} contributed to ${handleA}'s repository '${repo.name}'`,
              confidence: 0.9
            });
          }
        } catch (error) {
          // Skip individual repo errors
        }
      }

    } catch (error) {
      console.error('GitHub API error:', error);
    }

    return results;
  }

  private async checkFacebookConnections(profileA: string, profileB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];

    try {
      if (!process.env.FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Facebook API credentials required');
      }

      // Facebook Graph API - Very limited for privacy reasons
      // Most mutual friend data requires special permissions
      console.log('Facebook API would check connections between', profileA, profileB);
      
      // Note: Facebook severely limited API access for privacy
      // This would require app review and special permissions

    } catch (error) {
      console.error('Facebook API error:', error);
    }

    return results;
  }

  private async checkInstagramConnections(handleA: string, handleB: string): Promise<SocialAPIMutualConnection[]> {
    const results: SocialAPIMutualConnection[] = [];

    try {
      if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
        throw new Error('Instagram API credentials required');
      }

      // Instagram Basic Display API - Limited to user's own data
      // Cannot access other users' connections for privacy reasons
      console.log('Instagram API would check public interactions between', handleA, handleB);

    } catch (error) {
      console.error('Instagram API error:', error);
    }

    return results;
  }

  private parseConnectionResults(
    results: SocialAPIMutualConnection[], 
    platform: string
  ): ConnectionEvidence[] {
    return results.map(result => ({
      source: `${platform.charAt(0).toUpperCase() + platform.slice(1)} API`,
      evidence: result.evidence,
      score: result.confidence,
      metadata: {
        platform,
        type: result.type
      }
    }));
  }

  // Method to validate social handles and extract clean usernames
  validateSocialHandle(platform: string, handle: string): string | null {
    if (!handle) return null;

    let cleanHandle = handle.trim();

    switch (platform) {
      case 'twitter':
        // Remove @ symbol and URL parts
        cleanHandle = cleanHandle.replace(/^@/, '').replace(/.*twitter\.com\//, '');
        break;
      case 'linkedin':
        // Extract username from LinkedIn URL
        const linkedinMatch = cleanHandle.match(/linkedin\.com\/in\/([^\/]+)/);
        if (linkedinMatch) cleanHandle = linkedinMatch[1];
        break;
      case 'github':
        // Extract username from GitHub URL
        cleanHandle = cleanHandle.replace(/.*github\.com\//, '').split('/')[0];
        break;
      case 'facebook':
        // Extract username from Facebook URL
        cleanHandle = cleanHandle.replace(/.*facebook\.com\//, '').split('/')[0];
        break;
      case 'instagram':
        // Extract username from Instagram URL
        cleanHandle = cleanHandle.replace(/.*instagram\.com\//, '').split('/')[0];
        break;
    }

    return cleanHandle || null;
  }
}

export const socialAPIService = new SocialAPIService();