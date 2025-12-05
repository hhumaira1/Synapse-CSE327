import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import * as fuzz from 'fuzzball';

export interface EntityMatch<T> {
  entity: T;
  confidence: number; // 0-100
  matchedField: string; // 'firstName', 'lastName', 'email', etc.
}

@Injectable()
export class EntityResolverService {
  private readonly logger = new Logger(EntityResolverService.name);
  private readonly CONFIDENCE_THRESHOLD = 70; // Minimum confidence to suggest
  private readonly AUTO_USE_THRESHOLD = 90; // Auto-use without asking

  // Cache recent contact searches (10 minutes TTL)
  private contactCache = new Map<
    string,
    { contacts: any[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Find contact by name using fuzzy matching
   * Handles typos and partial matches
   */
  async findContactByName(
    name: string,
    tenantId: string,
  ): Promise<EntityMatch<any> | null> {
    const cacheKey = `${tenantId}:${name.toLowerCase()}`;

    // Check cache first
    const cached = this.contactCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for contact search: ${name}`);
      return this.fuzzyMatchContact(name, cached.contacts);
    }

    // Fetch all contacts for tenant
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        phone: true,
      },
    });

    // Cache the contacts
    this.contactCache.set(cacheKey.split(':')[0], {
      contacts,
      timestamp: Date.now(),
    });

    return this.fuzzyMatchContact(name, contacts);
  }

  /**
   * Fuzzy match a name against list of contacts
   */
  private fuzzyMatchContact(
    query: string,
    contacts: any[],
  ): EntityMatch<any> | null {
    const queryLower = query.toLowerCase().trim();
    let bestMatch: EntityMatch<any> | null = null;

    for (const contact of contacts) {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const firstNameOnly = contact.firstName.toLowerCase();
      const lastNameOnly = contact.lastName?.toLowerCase() || '';

      // Try matching against full name
      const fullNameScore = fuzz.ratio(queryLower, fullName);

      // Try matching against first name
      const firstNameScore = fuzz.ratio(queryLower, firstNameOnly);

      // Try matching against last name
      const lastNameScore = fuzz.ratio(queryLower, lastNameOnly);

      // Try partial matching (e.g., "humairah" matches "humairah nishu")
      const partialScore = fuzz.partial_ratio(queryLower, fullName);

      // Take the best score
      const bestScore = Math.max(
        fullNameScore,
        firstNameScore,
        lastNameScore,
        partialScore,
      );

      // Determine which field matched best
      let matchedField = 'fullName';
      if (bestScore === firstNameScore) matchedField = 'firstName';
      else if (bestScore === lastNameScore) matchedField = 'lastName';
      else if (bestScore === partialScore) matchedField = 'partialName';

      if (
        bestScore >= this.CONFIDENCE_THRESHOLD &&
        (!bestMatch || bestScore > bestMatch.confidence)
      ) {
        bestMatch = {
          entity: contact,
          confidence: bestScore,
          matchedField,
        };
      }
    }

    if (bestMatch) {
      this.logger.log(
        `Fuzzy match: "${query}" → "${bestMatch.entity.firstName} ${bestMatch.entity.lastName}" (confidence: ${bestMatch.confidence}%)`,
      );
    }

    return bestMatch;
  }

  /**
   * Search contacts by multiple fields (name, email, company, phone)
   */
  async searchContacts(
    query: string,
    tenantId: string,
    limit = 10,
  ): Promise<EntityMatch<any>[]> {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      take: 100, // Fetch more for fuzzy matching
    });

    const queryLower = query.toLowerCase().trim();
    const matches: EntityMatch<any>[] = [];

    for (const contact of contacts) {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = contact.email?.toLowerCase() || '';
      const company = contact.company?.toLowerCase() || '';
      const phone = contact.phone?.toLowerCase() || '';

      // Calculate scores for each field
      const nameScore = fuzz.partial_ratio(queryLower, fullName);
      const emailScore = email
        ? fuzz.partial_ratio(queryLower, email)
        : 0;
      const companyScore = company
        ? fuzz.partial_ratio(queryLower, company)
        : 0;
      const phoneScore = phone
        ? fuzz.partial_ratio(queryLower, phone)
        : 0;

      const bestScore = Math.max(
        nameScore,
        emailScore,
        companyScore,
        phoneScore,
      );

      let matchedField = 'name';
      if (bestScore === emailScore) matchedField = 'email';
      else if (bestScore === companyScore) matchedField = 'company';
      else if (bestScore === phoneScore) matchedField = 'phone';

      if (bestScore >= this.CONFIDENCE_THRESHOLD) {
        matches.push({
          entity: contact,
          confidence: bestScore,
          matchedField,
        });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches.slice(0, limit);
  }

  /**
   * Get auto-complete suggestions for contact names
   */
  async suggestContacts(
    partial: string,
    tenantId: string,
    limit = 5,
  ): Promise<any[]> {
    const matches = await this.searchContacts(partial, tenantId, limit);
    return matches.map((m) => m.entity);
  }

  /**
   * Check if confidence is high enough to auto-use
   */
  shouldAutoUse(confidence: number): boolean {
    return confidence >= this.AUTO_USE_THRESHOLD;
  }

  /**
   * Check if confidence warrants asking for confirmation
   */
  shouldAskConfirmation(confidence: number): boolean {
    return (
      confidence >= this.CONFIDENCE_THRESHOLD &&
      confidence < this.AUTO_USE_THRESHOLD
    );
  }

  /**
   * Clear cache (useful for testing or after bulk updates)
   */
  clearCache(): void {
    this.contactCache.clear();
    this.logger.log('Entity resolver cache cleared');
  }
}
