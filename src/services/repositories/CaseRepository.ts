import { BaseRepository } from './base';
import { 
  Case, 
  CaseStatus, 
  CasePriority, 
  CaseClassification,
  Result,
  ValidationError,
  DatabaseError,
  SearchFilters,
  DateRange
} from '@/types';
import { db } from '@/services/database';
import { generateUUID, generateCaseNumber, validateCaseNumber, validateSalesforceCaseNumber, validateJiraTicket } from '@/utils/generators';

export class CaseRepository extends BaseRepository<Case> {
  constructor() {
    super(db.cases);
  }

  /**
   * Create a new case with auto-generated ID and case number
   */
  async createCase(caseData: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>): Promise<Result<Case, DatabaseError | ValidationError>> {
    try {
      const id = generateUUID();
      const caseNumber = await generateCaseNumber();
      
      const newCase: Case = {
        ...caseData,
        id,
        caseNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.create(newCase);
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to create case: ${error instanceof Error ? error.message : 'Unknown error'}`)
      };
    }
  }

  /**
   * Find case by case number
   */
  async findByCaseNumber(caseNumber: string): Promise<Result<Case, DatabaseError | ValidationError>> {
    try {
      if (!validateCaseNumber(caseNumber)) {
        return {
          success: false,
          error: new ValidationError('Invalid case number format. Must be 8 digits.', 'caseNumber')
        };
      }

      return await this.safeOperation(
        async () => {
          const cases = await this.table.where('caseNumber').equals(caseNumber).toArray();
          if (cases.length === 0) {
            throw new Error(`Case not found with case number: ${caseNumber}`);
          }
          return cases[0];
        },
        'Failed to find case by case number'
      );
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to find case: ${error instanceof Error ? error.message : 'Unknown error'}`)
      };
    }
  }

  /**
   * Find cases by status
   */
  async findByStatus(status: CaseStatus): Promise<Result<Case[], DatabaseError>> {
    return await this.safeOperation(
      async () => await this.table.where('status').equals(status).toArray(),
      'Failed to find cases by status'
    );
  }

  /**
   * Find cases by priority
   */
  async findByPriority(priority: CasePriority): Promise<Result<Case[], DatabaseError>> {
    return await this.safeOperation(
      async () => await this.table.where('priority').equals(priority).toArray(),
      'Failed to find cases by priority'
    );
  }

  /**
   * Find cases by customer
   */
  async findByCustomer(customerId: string): Promise<Result<Case[], DatabaseError>> {
    return await this.safeOperation(
      async () => await this.table.where('customerId').equals(customerId).toArray(),
      'Failed to find cases by customer'
    );
  }

  /**
   * Search cases with filters
   */
  async search(filters: SearchFilters): Promise<Result<Case[], DatabaseError>> {
    return await this.safeOperation(
      async () => {
        let query = this.table.toCollection();

        // Apply status filters
        if (filters.status && filters.status.length > 0) {
          query = query.filter(case_ => filters.status!.includes(case_.status));
        }

        // Apply priority filters
        if (filters.priority && filters.priority.length > 0) {
          query = query.filter(case_ => filters.priority!.includes(case_.priority));
        }

        // Apply classification filters
        if (filters.classification && filters.classification.length > 0) {
          query = query.filter(case_ => filters.classification!.includes(case_.classification));
        }

        // Apply customer filter
        if (filters.customerId) {
          query = query.filter(case_ => case_.customerId === filters.customerId);
        }

        // Apply date range filter
        if (filters.dateRange) {
          query = query.filter(case_ => {
            const caseDate = new Date(case_.createdAt);
            return caseDate >= filters.dateRange!.from && caseDate <= filters.dateRange!.to;
          });
        }

        // Apply tag filters
        if (filters.tags && filters.tags.length > 0) {
          query = query.filter(case_ => 
            filters.tags!.some(tag => case_.tags.includes(tag))
          );
        }

        return await query.toArray();
      },
      'Failed to search cases'
    );
  }

  /**
   * Update case status
   */
  async updateStatus(caseId: string, status: CaseStatus): Promise<Result<Case, DatabaseError | ValidationError>> {
    const updates: Partial<Case> = { status };
    
    // Set resolved/closed timestamps
    if (status === 'resolved') {
      updates.resolvedAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
    }

    return await this.update(caseId, updates);
  }

  /**
   * Assign case to user
   */
  async assignCase(caseId: string, assignedTo: string): Promise<Result<Case, DatabaseError | ValidationError>> {
    return await this.update(caseId, { assignedTo });
  }

  /**
   * Add resolution notes
   */
  async addResolutionNotes(caseId: string, notes: string): Promise<Result<Case, DatabaseError | ValidationError>> {
    return await this.update(caseId, { resolutionNotes: notes });
  }

  /**
   * Add tags to case
   */
  async addTags(caseId: string, newTags: string[]): Promise<Result<Case, DatabaseError | ValidationError>> {
    const existingResult = await this.findById(caseId);
    if (!existingResult.success) {
      return existingResult;
    }

    const existingTags = existingResult.data.tags;
    const uniqueNewTags = newTags.filter(tag => !existingTags.includes(tag));
    const updatedTags = [...existingTags, ...uniqueNewTags];

    return await this.update(caseId, { tags: updatedTags });
  }

  /**
   * Remove tags from case
   */
  async removeTags(caseId: string, tagsToRemove: string[]): Promise<Result<Case, DatabaseError | ValidationError>> {
    const existingResult = await this.findById(caseId);
    if (!existingResult.success) {
      return existingResult;
    }

    const updatedTags = existingResult.data.tags.filter(tag => !tagsToRemove.includes(tag));
    return await this.update(caseId, { tags: updatedTags });
  }

  /**
   * Get cases created in date range
   */
  async getCasesInDateRange(dateRange: DateRange): Promise<Result<Case[], DatabaseError>> {
    return await this.safeOperation(
      async () => {
        return await this.table
          .where('createdAt')
          .between(dateRange.from, dateRange.to)
          .toArray();
      },
      'Failed to get cases in date range'
    );
  }

  /**
   * Get recent cases (last N days)
   */
  async getRecentCases(days: number = 7): Promise<Result<Case[], DatabaseError>> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return await this.getCasesInDateRange({
      from: fromDate,
      to: new Date()
    });
  }

  /**
   * Get case statistics
   */
  async getStatistics(): Promise<Result<Record<string, any>, DatabaseError>> {
    return await this.safeOperation(
      async () => {
        const allCases = await this.table.toArray();
        
        const stats = {
          total: allCases.length,
          byStatus: {} as Record<CaseStatus, number>,
          byPriority: {} as Record<CasePriority, number>,
          byClassification: {} as Record<CaseClassification, number>,
          averageResolutionTime: 0,
          oldestCase: null as Case | null,
          newestCase: null as Case | null
        };

        // Initialize counters
        const statuses: CaseStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];
        const priorities: CasePriority[] = ['low', 'medium', 'high', 'urgent'];
        const classifications: CaseClassification[] = ['error', 'query', 'feature_request'];

        statuses.forEach(status => stats.byStatus[status] = 0);
        priorities.forEach(priority => stats.byPriority[priority] = 0);
        classifications.forEach(classification => stats.byClassification[classification] = 0);

        let totalResolutionTime = 0;
        let resolvedCases = 0;

        for (const case_ of allCases) {
          // Count by status
          stats.byStatus[case_.status]++;
          
          // Count by priority
          stats.byPriority[case_.priority]++;
          
          // Count by classification
          stats.byClassification[case_.classification]++;
          
          // Calculate resolution time for resolved cases
          if (case_.resolvedAt) {
            const resolutionTime = new Date(case_.resolvedAt).getTime() - new Date(case_.createdAt).getTime();
            totalResolutionTime += resolutionTime;
            resolvedCases++;
          }
          
          // Track oldest and newest
          if (!stats.oldestCase || new Date(case_.createdAt) < new Date(stats.oldestCase.createdAt)) {
            stats.oldestCase = case_;
          }
          if (!stats.newestCase || new Date(case_.createdAt) > new Date(stats.newestCase.createdAt)) {
            stats.newestCase = case_;
          }
        }

        // Calculate average resolution time in hours
        if (resolvedCases > 0) {
          stats.averageResolutionTime = Math.round((totalResolutionTime / resolvedCases) / (1000 * 60 * 60));
        }

        return stats;
      },
      'Failed to get case statistics'
    );
  }

  /**
   * Validate case entity
   */
  protected async validateEntity(case_: Case): Promise<void> {
    // Validate required fields
    if (!case_.title || case_.title.trim().length === 0) {
      throw new ValidationError('Case title is required', 'title');
    }

    if (!case_.description || case_.description.trim().length === 0) {
      throw new ValidationError('Case description is required', 'description');
    }

    if (case_.title.length > 200) {
      throw new ValidationError('Case title must be less than 200 characters', 'title');
    }

    if (case_.description.length > 5000) {
      throw new ValidationError('Case description must be less than 5000 characters', 'description');
    }

    // Validate case number format
    if (case_.caseNumber && !validateCaseNumber(case_.caseNumber)) {
      throw new ValidationError('Invalid case number format. Must be 8 digits.', 'caseNumber');
    }

    // Validate Salesforce case number if provided
    if (case_.salesforceCaseNumber && !validateSalesforceCaseNumber(case_.salesforceCaseNumber)) {
      throw new ValidationError('Invalid Salesforce case number format. Must be 8 digits.', 'salesforceCaseNumber');
    }

    // Validate JIRA ticket if provided
    if (case_.jiraTicket && !validateJiraTicket(case_.jiraTicket)) {
      throw new ValidationError('Invalid JIRA ticket format. Must be DOMO-XXXXXX or HIVE-XXXX.', 'jiraTicket');
    }

    // Validate customer name if provided
    if (case_.customerName && case_.customerName.length > 100) {
      throw new ValidationError('Customer name must be less than 100 characters', 'customerName');
    }

    // Validate resolution notes if provided
    if (case_.resolutionNotes && case_.resolutionNotes.length > 2000) {
      throw new ValidationError('Resolution notes must be less than 2000 characters', 'resolutionNotes');
    }

    // Validate tags
    if (case_.tags.length > 20) {
      throw new ValidationError('Maximum 20 tags allowed per case', 'tags');
    }

    for (const tag of case_.tags) {
      if (tag.length > 50) {
        throw new ValidationError('Individual tags must be less than 50 characters', 'tags');
      }
    }

    // Validate artifacts array
    if (case_.artifacts.length > 50) {
      throw new ValidationError('Maximum 50 artifacts allowed per case', 'artifacts');
    }
  }
}

// Export singleton instance
export const caseRepository = new CaseRepository();