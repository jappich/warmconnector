import { db } from '../db';
import { persons, relationships } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface ContactData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
}

interface ProcessingResult {
  totalContacts: number;
  processedContacts: number;
  newConnections: number;
  existingConnections: number;
  errors: string[];
}

export class ContactProcessor {
  private errors: string[] = [];

  async processContacts(contacts: ContactData[], userId: string): Promise<ProcessingResult> {
    this.errors = [];
    let processedContacts = 0;
    let newConnections = 0;
    let existingConnections = 0;

    // Ensure user person record exists
    await this.ensureUserPersonExists(userId);

    for (const contact of contacts) {
      try {
        if (!contact.name || contact.name.trim().length === 0) {
          this.errors.push(`Skipped contact with missing name`);
          continue;
        }

        const result = await this.processSingleContact(contact, userId);
        if (result.isNew) {
          newConnections++;
        } else {
          existingConnections++;
        }
        processedContacts++;
      } catch (error) {
        this.errors.push(`Failed to process ${contact.name}: ${error}`);
      }
    }

    return {
      totalContacts: contacts.length,
      processedContacts,
      newConnections,
      existingConnections,
      errors: this.errors
    };
  }

  private async processSingleContact(contact: ContactData, userId: string): Promise<{ isNew: boolean, personId: string }> {
    // Generate a consistent ID for the contact
    const personId = this.generatePersonId(contact);
    
    // Check if person already exists
    const existingPerson = await db
      .select()
      .from(persons)
      .where(eq(persons.id, personId))
      .limit(1);

    let isNew = false;

    if (existingPerson.length === 0) {
      // Create new person
      await db.insert(persons).values({
        id: personId,
        name: contact.name.trim(),
        email: contact.email?.trim() || null,
        company: contact.company?.trim() || null,
        title: contact.title?.trim() || null,
        source: 'contact_upload',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      isNew = true;
    } else {
      // Update existing person with any new information
      const updates: any = { updatedAt: new Date() };
      
      if (contact.email && !existingPerson[0].email) {
        updates.email = contact.email.trim();
      }
      if (contact.company && !existingPerson[0].company) {
        updates.company = contact.company.trim();
      }
      if (contact.title && !existingPerson[0].title) {
        updates.title = contact.title.trim();
      }

      if (Object.keys(updates).length > 1) { // More than just updatedAt
        await db
          .update(persons)
          .set(updates)
          .where(eq(persons.id, personId));
      }
    }

    // Create relationship between user and this contact
    await this.createUserContactRelationship(userId, personId);

    return { isNew, personId };
  }

  private generatePersonId(contact: ContactData): string {
    // Create a consistent ID based on name and email/phone
    const identifier = contact.email || contact.phone || contact.name.toLowerCase().replace(/\s+/g, '_');
    return `contact_${identifier.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
  }

  private async createUserContactRelationship(userId: string, contactPersonId: string): Promise<void> {
    const userPersonId = `user-${userId}`;
    
    // Check if relationship already exists
    const existingRelationship = await db
      .select()
      .from(relationships)
      .where(
        and(
          eq(relationships.fromPersonId, userPersonId),
          eq(relationships.toPersonId, contactPersonId)
        )
      )
      .limit(1);

    if (existingRelationship.length === 0) {
      await db.insert(relationships).values({
        fromPersonId: userPersonId,
        toPersonId: contactPersonId,
        relationshipType: 'contact',
        strength: 80, // Strong connection since it's a direct contact (0-100 scale)
        metadata: { source: 'contact_upload' },
        createdAt: new Date()
      });
    }
  }

  private async ensureUserPersonExists(userId: string): Promise<void> {
    const userPersonId = `user-${userId}`;
    
    // Check if user person already exists
    const existingUserPerson = await db
      .select()
      .from(persons)
      .where(eq(persons.id, userPersonId))
      .limit(1);

    if (existingUserPerson.length === 0) {
      // Create user person record
      await db.insert(persons).values({
        id: userPersonId,
        name: `User ${userId}`,
        source: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  parseCSV(csvContent: string): ContactData[] {
    const lines = csvContent.split('\n');
    const contacts: ContactData[] = [];
    
    if (lines.length < 2) return contacts;

    // Try to detect CSV format
    const header = lines[0].toLowerCase();
    const hasEmail = header.includes('email');
    const hasPhone = header.includes('phone');
    const hasCompany = header.includes('company') || header.includes('organization');
    const hasTitle = header.includes('title') || header.includes('job');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length === 0) continue;

      const contact: ContactData = {
        name: values[0]?.trim() || ''
      };

      // Map additional fields based on header detection
      if (values.length > 1 && hasEmail) {
        contact.email = values[1]?.trim() || undefined;
      }
      if (values.length > 2 && hasPhone) {
        contact.phone = values[2]?.trim() || undefined;
      }
      if (values.length > 3 && hasCompany) {
        contact.company = values[3]?.trim() || undefined;
      }
      if (values.length > 4 && hasTitle) {
        contact.title = values[4]?.trim() || undefined;
      }

      if (contact.name) {
        contacts.push(contact);
      }
    }

    return contacts;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
  }

  parseVCF(vcfContent: string): ContactData[] {
    const contacts: ContactData[] = [];
    const vcards = vcfContent.split('BEGIN:VCARD');
    
    for (const vcard of vcards) {
      if (!vcard.includes('END:VCARD')) continue;
      
      const contact: ContactData = { name: '' };
      const lines = vcard.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('FN:')) {
          contact.name = trimmed.substring(3).trim();
        } else if (trimmed.startsWith('EMAIL')) {
          const emailMatch = trimmed.match(/:(.*)/);
          if (emailMatch) {
            contact.email = emailMatch[1].trim();
          }
        } else if (trimmed.startsWith('ORG:')) {
          contact.company = trimmed.substring(4).trim();
        } else if (trimmed.startsWith('TITLE:')) {
          contact.title = trimmed.substring(6).trim();
        }
      }
      
      if (contact.name) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  }
}