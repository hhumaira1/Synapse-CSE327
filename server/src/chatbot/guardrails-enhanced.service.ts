import { Injectable, Logger } from '@nestjs/common';

/**
 * Security Guardrails Service
 * 
 * RESPONSIBILITY: Infrastructure security ONLY
 * - Malicious pattern detection (XSS, injection attacks)
 * - Input sanitization
 * - Rate limiting protection
 * 
 * NOT RESPONSIBLE FOR:
 * - CRM scope enforcement (handled by MCP system prompt)
 * - Intent detection (handled by AI)
 * - Business logic validation (handled by MCP RBAC)
 * 
 * Architecture:
 * Frontend → Backend Security → Gemini AI → MCP (scope + RBAC) → Backend API
 */
@Injectable()
export class GuardrailsEnhancedService {
  private readonly logger = new Logger(GuardrailsEnhancedService.name);

  /**
   * Validate input for malicious patterns ONLY
   * Scope enforcement is handled by MCP server's STRICT_SYSTEM_PROMPT
   */
  validateQuery(query: string): {
    isValid: boolean;
    reason?: string;
  } {
    const normalizedQuery = query.toLowerCase().trim();

    // Block malicious patterns (XSS, injection attacks)
    const maliciousPatterns = [
      '<script',
      'javascript:',
      'onerror=',
      'onclick=',
      'onload=',
      'eval(',
      'exec(',
      'expression(',
      'vbscript:',
      'data:text/html',
      // SQL injection patterns
      'union select',
      'drop table',
      'insert into',
      'delete from',
      'update set',
      '--',
      ';--',
      // Command injection
      '&&',
      '||',
      '`',
      '$()',
    ];

    for (const pattern of maliciousPatterns) {
      if (normalizedQuery.includes(pattern)) {
        this.logger.warn(`Blocked malicious pattern: ${pattern}`);
        return {
          isValid: false,
          reason: 'Invalid input detected. Please rephrase your request.',
        };
      }
    }

    // All scope validation is handled by MCP server
    return { isValid: true };
  }

  /**
   * Sanitize user input (XSS protection + length limit)
   */
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
      .replace(/<embed[^>]*>/gi, '') // Remove embeds
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .substring(0, 2000); // Limit to 2000 chars
  }
}
