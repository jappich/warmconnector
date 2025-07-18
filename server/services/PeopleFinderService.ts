import axios from 'axios';
import { connectionRepository } from '../repositories/ConnectionRepository';
import type { ConnectionEvidence, UserProfile } from '../repositories/ConnectionRepository';

interface PeopleSearchResult {
  name: string;
  addresses: string[];
  phoneNumbers: string[];
  relatives: string[];
  associates: string[];
  ageRange?: string;
  previousAddresses?: string[];
}

interface AddressMatch {
  address: string;
  timeframe?: string;
  confidence: number;
}

export class PeopleFinderService {
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly REQUEST_DELAY = 2000; // 2 seconds between requests to avoid rate limits

  async findPeopleConnections(userA: UserProfile, userB: UserProfile): Promise<ConnectionEvidence[]> {
    const connections: ConnectionEvidence[] = [];

    // Check each people finder source
    const sources = [
      { name: 'TruePeopleSearch', method: this.searchTruePeopleSearch.bind(this) },
      { name: 'ZabaSearch', method: this.searchZabaSearch.bind(this) },
      { name: 'FastPeopleSearch', method: this.searchFastPeopleSearch.bind(this) }
    ];

    for (const source of sources) {
      try {
        const sourceConnections = await this.findConnectionsFromSource(
          source.name,
          source.method,
          userA,
          userB
        );
        connections.push(...sourceConnections);
        
        // Rate limiting delay
        await this.delay(this.REQUEST_DELAY);
      } catch (error) {
        console.error(`Error with ${source.name}:`, error);
      }
    }

    return connections;
  }

  private async findConnectionsFromSource(
    sourceName: string,
    searchMethod: (name: string) => Promise<PeopleSearchResult | null>,
    userA: UserProfile,
    userB: UserProfile
  ): Promise<ConnectionEvidence[]> {
    const connections: ConnectionEvidence[] = [];
    
    // Search for both users
    const resultA = await this.getCachedOrSearch(sourceName, userA.name, searchMethod);
    const resultB = await this.getCachedOrSearch(sourceName, userB.name, searchMethod);

    if (!resultA || !resultB) return connections;

    // Check for address overlaps
    const addressMatches = this.findAddressOverlaps(resultA, resultB);
    for (const match of addressMatches) {
      connections.push({
        source: `${sourceName} Public Records`,
        evidence: `Both lived at ${match.address}${match.timeframe ? ` in ${match.timeframe}` : ''}`,
        score: match.confidence,
        metadata: {
          source: sourceName.toLowerCase(),
          type: 'address_overlap',
          address: match.address,
          timeframe: match.timeframe
        }
      });
    }

    // Check for relative/associate connections
    const relativeConnections = this.findRelativeConnections(resultA, resultB, userA.name, userB.name);
    connections.push(...relativeConnections.map(conn => ({
      source: `${sourceName} Public Records`,
      evidence: conn.evidence,
      score: conn.score,
      metadata: {
        source: sourceName.toLowerCase(),
        type: 'relative_associate',
        relationship: conn.type
      }
    })));

    return connections;
  }

  private async getCachedOrSearch(
    source: string,
    name: string,
    searchMethod: (name: string) => Promise<PeopleSearchResult | null>
  ): Promise<PeopleSearchResult | null> {
    const cacheKey = `${source.toLowerCase()}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check cache first
    const cached = await connectionRepository.getCachedLookup('people_finder', cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    const result = await searchMethod(name);
    
    // Cache the result
    if (result) {
      const expiresAt = new Date(Date.now() + this.CACHE_DURATION);
      await connectionRepository.cacheLookup('people_finder', cacheKey, result, expiresAt);
    }

    return result;
  }

  private async searchTruePeopleSearch(name: string): Promise<PeopleSearchResult | null> {
    try {
      // TruePeopleSearch scraping approach
      const searchUrl = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(name)}`;
      
      // Note: In production, you would use a proper scraping service or API
      // This is a simplified example
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      // Parse the HTML response (simplified)
      // In production, you'd use a proper HTML parser like Cheerio
      const htmlContent = response.data;
      
      return this.parseTruePeopleSearchResponse(htmlContent, name);
    } catch (error) {
      console.error('TruePeopleSearch error:', error);
      return null;
    }
  }

  private parseTruePeopleSearchResponse(html: string, searchName: string): PeopleSearchResult | null {
    // Simplified parser - in production you'd use Cheerio or similar
    try {
      // Extract basic information patterns
      const addressMatches = html.match(/\d+\s+[A-Za-z\s]+(?:St|Ave|Rd|Dr|Ln|Blvd|Way|Ct|Pl)[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/g) || [];
      const phoneMatches = html.match(/\(\d{3}\)\s*\d{3}-\d{4}/g) || [];
      
      return {
        name: searchName,
        addresses: addressMatches.slice(0, 5), // Limit to first 5 addresses
        phoneNumbers: phoneMatches.slice(0, 3),
        relatives: [],
        associates: []
      };
    } catch (error) {
      console.error('Error parsing TruePeopleSearch response:', error);
      return null;
    }
  }

  private async searchZabaSearch(name: string): Promise<PeopleSearchResult | null> {
    try {
      // ZabaSearch approach - similar pattern
      const searchUrl = `https://www.zabasearch.com/search?name=${encodeURIComponent(name)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      return this.parseZabaSearchResponse(response.data, name);
    } catch (error) {
      console.error('ZabaSearch error:', error);
      return null;
    }
  }

  private parseZabaSearchResponse(html: string, searchName: string): PeopleSearchResult | null {
    // Simplified parser for ZabaSearch format
    try {
      const addressMatches = html.match(/\d+\s+[A-Za-z0-9\s#\.]+[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}[\s\d-]*/g) || [];
      
      return {
        name: searchName,
        addresses: addressMatches.slice(0, 3),
        phoneNumbers: [],
        relatives: [],
        associates: []
      };
    } catch (error) {
      console.error('Error parsing ZabaSearch response:', error);
      return null;
    }
  }

  private async searchFastPeopleSearch(name: string): Promise<PeopleSearchResult | null> {
    try {
      // FastPeopleSearch approach
      const searchUrl = `https://www.fastpeoplesearch.com/name/${encodeURIComponent(name.replace(/\s+/g, '-'))}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      return this.parseFastPeopleSearchResponse(response.data, name);
    } catch (error) {
      console.error('FastPeopleSearch error:', error);
      return null;
    }
  }

  private parseFastPeopleSearchResponse(html: string, searchName: string): PeopleSearchResult | null {
    // Simplified parser for FastPeopleSearch format
    try {
      // Extract address patterns
      const addressMatches = html.match(/\d+\s+[A-Za-z0-9\s#\.-]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/g) || [];
      const relativeMatches = html.match(/Related to:\s*([A-Za-z\s,]+)/i);
      
      const relatives = relativeMatches 
        ? relativeMatches[1].split(',').map(name => name.trim()).filter(Boolean)
        : [];

      return {
        name: searchName,
        addresses: addressMatches.slice(0, 4),
        phoneNumbers: [],
        relatives: relatives.slice(0, 5),
        associates: []
      };
    } catch (error) {
      console.error('Error parsing FastPeopleSearch response:', error);
      return null;
    }
  }

  private findAddressOverlaps(resultA: PeopleSearchResult, resultB: PeopleSearchResult): AddressMatch[] {
    const matches: AddressMatch[] = [];
    
    for (const addrA of resultA.addresses) {
      for (const addrB of resultB.addresses) {
        const similarity = this.calculateAddressSimilarity(addrA, addrB);
        
        if (similarity > 0.8) {
          matches.push({
            address: addrA,
            confidence: similarity * 0.5, // Scale down for people finder sources
            timeframe: this.extractTimeframe(addrA) || this.extractTimeframe(addrB)
          });
        }
      }
    }

    return matches;
  }

  private findRelativeConnections(
    resultA: PeopleSearchResult, 
    resultB: PeopleSearchResult,
    nameA: string,
    nameB: string
  ): Array<{ evidence: string; score: number; type: string }> {
    const connections: Array<{ evidence: string; score: number; type: string }> = [];

    // Check if B is listed as relative of A
    for (const relative of resultA.relatives) {
      if (this.namesSimilar(relative, nameB)) {
        connections.push({
          evidence: `${nameB} listed as relative of ${nameA}`,
          score: 0.6,
          type: 'relative'
        });
      }
    }

    // Check if A is listed as relative of B
    for (const relative of resultB.relatives) {
      if (this.namesSimilar(relative, nameA)) {
        connections.push({
          evidence: `${nameA} listed as relative of ${nameB}`,
          score: 0.6,
          type: 'relative'
        });
      }
    }

    // Check associates
    for (const associate of resultA.associates) {
      if (this.namesSimilar(associate, nameB)) {
        connections.push({
          evidence: `${nameB} listed as associate of ${nameA}`,
          score: 0.4,
          type: 'associate'
        });
      }
    }

    return connections;
  }

  private calculateAddressSimilarity(addr1: string, addr2: string): number {
    const clean1 = addr1.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const clean2 = addr2.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (clean1 === clean2) return 1.0;
    
    // Extract street number and name for comparison
    const street1 = clean1.replace(/\d+/g, '').trim();
    const street2 = clean2.replace(/\d+/g, '').trim();
    
    if (street1 === street2) return 0.9;
    
    // Check if one address contains the other
    if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.8;
    
    return 0;
  }

  private namesSimilar(name1: string, name2: string): boolean {
    const clean1 = name1.toLowerCase().trim();
    const clean2 = name2.toLowerCase().trim();
    
    if (clean1 === clean2) return true;
    
    // Check if names share first and last name components
    const parts1 = clean1.split(/\s+/);
    const parts2 = clean2.split(/\s+/);
    
    if (parts1.length >= 2 && parts2.length >= 2) {
      return parts1[0] === parts2[0] && parts1[parts1.length - 1] === parts2[parts2.length - 1];
    }
    
    return false;
  }

  private extractTimeframe(address: string): string | undefined {
    // Look for year patterns in address data
    const yearMatch = address.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to validate if people finder APIs are working
  async validatePeopleFinderAPIs(): Promise<{ [key: string]: boolean }> {
    const status = {
      truePeopleSearch: false,
      zabaSearch: false,
      fastPeopleSearch: false
    };

    try {
      // Test each service with a common name
      const testName = "John Smith";
      
      // Test TruePeopleSearch
      try {
        await this.searchTruePeopleSearch(testName);
        status.truePeopleSearch = true;
      } catch (error) {
        console.log('TruePeopleSearch not available');
      }

      // Test ZabaSearch
      try {
        await this.searchZabaSearch(testName);
        status.zabaSearch = true;
      } catch (error) {
        console.log('ZabaSearch not available');
      }

      // Test FastPeopleSearch
      try {
        await this.searchFastPeopleSearch(testName);
        status.fastPeopleSearch = true;
      } catch (error) {
        console.log('FastPeopleSearch not available');
      }

    } catch (error) {
      console.error('Error validating people finder APIs:', error);
    }

    return status;
  }
}

export const peopleFinderService = new PeopleFinderService();