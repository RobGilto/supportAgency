import { db } from '@/services/database';

/**
 * Generate a UUID using the Web Crypto API
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate an 8-digit case number (e.g., "05907169")
 * Format: YYYYMMDD based but with random components to avoid collisions
 */
export async function generateCaseNumber(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate 8-digit number with some date-based logic
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Add 2 random digits to make it 8 digits total
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    const caseNumber = `${year}${month}${day}${randomPart}`;

    // Check if this case number already exists
    const existingCase = await db.cases.where('caseNumber').equals(caseNumber).first();
    
    if (!existingCase) {
      return caseNumber;
    }

    attempts++;
  }

  // If we couldn't generate a unique number after max attempts, 
  // fall back to pure random 8-digit number
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Validate case number format (8 digits)
 */
export function validateCaseNumber(caseNumber: string): boolean {
  return /^\d{8}$/.test(caseNumber);
}

/**
 * Validate Salesforce case number format (8 digits)
 */
export function validateSalesforceCaseNumber(caseNumber: string): boolean {
  return /^\d{8}$/.test(caseNumber);
}

/**
 * Validate JIRA ticket format (DOMO-XXXXXX or HIVE-XXXX)
 */
export function validateJiraTicket(ticket: string): boolean {
  return /^(DOMO-\d{6}|HIVE-\d{4})$/.test(ticket);
}

/**
 * Generate a thumbnail filename from original filename
 */
export function generateThumbnailFilename(originalFilename: string): string {
  const extension = originalFilename.split('.').pop() || 'webp';
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_thumb.${extension}`;
}

/**
 * Generate a safe filename from user input
 */
export function generateSafeFilename(input: string, extension?: string): string {
  // Remove dangerous characters and normalize
  let filename = input
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 100); // Limit length

  if (extension) {
    filename += `.${extension}`;
  }

  return filename || `file_${Date.now()}${extension ? `.${extension}` : ''}`;
}

/**
 * Generate a layer ID for image annotations
 */
export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate current timestamp in ISO format
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate a search ID for saved searches
 */
export function generateSearchId(query: string): string {
  const sanitized = query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20);
  
  return `search_${sanitized}_${Date.now()}`;
}