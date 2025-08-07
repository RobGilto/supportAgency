import { ContentPattern, PatternType, CaseClassification, Result, ValidationError, DatabaseError } from '@/types';
import { BaseRepository } from './base';
import { db } from '@/services/database';

export interface PatternSearchFilters {
  patternType?: PatternType;
  category?: CaseClassification;
  minConfidence?: number;
  minSuccessRate?: number;
}

export interface PatternStatistics {
  totalPatterns: number;
  patternsByType: Record<PatternType, number>;
  patternsByCategory: Record<CaseClassification, number>;
  averageConfidence: number;
  averageSuccessRate: number;
  topPerformingPatterns: ContentPattern[];
}

export class ContentPatternRepository extends BaseRepository<ContentPattern> {
  constructor() {
    super(db.contentPatterns);
  }

  /**
   * Find patterns by search filters
   */
  async findByFilters(filters: PatternSearchFilters): Promise<Result<ContentPattern[]>> {
    try {
      const allPatterns = await this.table.toArray();
      const patterns = allPatterns.sort((a, b) => b.confidence - a.confidence);
      
      // Apply filters
      let filteredPatterns = patterns;

      if (filters.patternType) {
        filteredPatterns = filteredPatterns.filter(p => p.patternType === filters.patternType);
      }

      if (filters.category) {
        filteredPatterns = filteredPatterns.filter(p => p.category === filters.category);
      }

      if (filters.minConfidence !== undefined) {
        filteredPatterns = filteredPatterns.filter(p => p.confidence >= filters.minConfidence!);
      }

      if (filters.minSuccessRate !== undefined) {
        filteredPatterns = filteredPatterns.filter(p => p.successRate >= filters.minSuccessRate!);
      }

      return { success: true, data: filteredPatterns };
    } catch (error) {
      return this.handleError(error, 'Failed to find patterns by filters');
    }
  }

  /**
   * Find patterns by category
   */
  async findByCategory(category: CaseClassification): Promise<Result<ContentPattern[]>> {
    try {
      const allPatterns = await this.table
        .where('category')
        .equals(category)
        .toArray();
      
      const patterns = allPatterns.sort((a, b) => b.confidence - a.confidence);

      return { success: true, data: patterns };
    } catch (error) {
      return this.handleError(error, `Failed to find patterns by category: ${category}`);
    }
  }

  /**
   * Find patterns by type
   */
  async findByType(patternType: PatternType): Promise<Result<ContentPattern[]>> {
    try {
      const allPatterns = await this.table
        .where('patternType')
        .equals(patternType)
        .toArray();
      
      const patterns = allPatterns.sort((a, b) => b.confidence - a.confidence);

      return { success: true, data: patterns };
    } catch (error) {
      return this.handleError(error, `Failed to find patterns by type: ${patternType}`);
    }
  }

  /**
   * Find top performing patterns
   */
  async findTopPerforming(limit: number = 10): Promise<Result<ContentPattern[]>> {
    try {
      const allPatterns = await this.table.toArray();
      const patterns = allPatterns
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, limit);

      return { success: true, data: patterns };
    } catch (error) {
      return this.handleError(error, 'Failed to find top performing patterns');
    }
  }

  /**
   * Update pattern success rate
   */
  async updateSuccessRate(id: string, newSuccessRate: number): Promise<Result<ContentPattern>> {
    try {
      const pattern = await this.findById(id);
      if (!pattern.success) {
        return pattern;
      }

      const updatedPattern = {
        ...pattern.data,
        successRate: Math.max(0, Math.min(1, newSuccessRate)) // Clamp between 0 and 1
      };

      await this.table.update(id, { successRate: updatedPattern.successRate });

      return { success: true, data: updatedPattern };
    } catch (error) {
      return this.handleError(error, `Failed to update success rate for pattern: ${id}`);
    }
  }

  /**
   * Add example to pattern
   */
  async addExample(id: string, example: string): Promise<Result<ContentPattern>> {
    try {
      const pattern = await this.findById(id);
      if (!pattern.success) {
        return pattern;
      }

      const updatedExamples = [...pattern.data.examples];
      
      // Avoid duplicates and limit examples to 5
      if (!updatedExamples.includes(example)) {
        updatedExamples.push(example);
        if (updatedExamples.length > 5) {
          updatedExamples.shift(); // Remove oldest example
        }
      }

      await this.table.update(id, { examples: updatedExamples });

      const updatedPattern = { ...pattern.data, examples: updatedExamples };
      return { success: true, data: updatedPattern };
    } catch (error) {
      return this.handleError(error, `Failed to add example to pattern: ${id}`);
    }
  }

  /**
   * Get pattern statistics
   */
  async getStatistics(): Promise<Result<PatternStatistics>> {
    try {
      const patterns = await this.table.toArray();

      if (patterns.length === 0) {
        return {
          success: true,
          data: {
            totalPatterns: 0,
            patternsByType: {} as Record<PatternType, number>,
            patternsByCategory: {} as Record<CaseClassification, number>,
            averageConfidence: 0,
            averageSuccessRate: 0,
            topPerformingPatterns: []
          }
        };
      }

      // Calculate statistics
      const patternsByType: Record<PatternType, number> = {
        keyword: 0,
        regex: 0,
        semantic: 0
      };

      const patternsByCategory: Record<CaseClassification, number> = {
        error: 0,
        query: 0,
        feature_request: 0,
        general: 0,
        technical: 0,
        bug: 0
      };

      let totalConfidence = 0;
      let totalSuccessRate = 0;

      for (const pattern of patterns) {
        patternsByType[pattern.patternType]++;
        patternsByCategory[pattern.category]++;
        totalConfidence += pattern.confidence;
        totalSuccessRate += pattern.successRate;
      }

      // Get top performing patterns
      const topPerformingPatterns = patterns
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      const statistics: PatternStatistics = {
        totalPatterns: patterns.length,
        patternsByType,
        patternsByCategory,
        averageConfidence: totalConfidence / patterns.length,
        averageSuccessRate: totalSuccessRate / patterns.length,
        topPerformingPatterns
      };

      return { success: true, data: statistics };
    } catch (error) {
      return this.handleError(error, 'Failed to get pattern statistics');
    }
  }

  /**
   * Clean up low-performing patterns
   */
  async cleanupLowPerforming(minSuccessRate: number = 0.3): Promise<Result<number>> {
    try {
      const patterns = await this.table.toArray();
      const lowPerformingPatterns = patterns.filter(p => p.successRate < minSuccessRate);
      
      if (lowPerformingPatterns.length === 0) {
        return { success: true, data: 0 };
      }

      // Delete low-performing patterns
      const idsToDelete = lowPerformingPatterns.map(p => p.id);
      await this.table.bulkDelete(idsToDelete);

      return { success: true, data: idsToDelete.length };
    } catch (error) {
      return this.handleError(error, 'Failed to cleanup low-performing patterns');
    }
  }

  /**
   * Merge similar patterns
   */
  async mergeSimilarPatterns(similarityThreshold: number = 0.8): Promise<Result<number>> {
    try {
      const patterns = await this.table.toArray();
      const mergedPatterns: ContentPattern[] = [];
      const toDelete: string[] = [];

      // Simple similarity check based on pattern content
      for (let i = 0; i < patterns.length; i++) {
        const pattern1 = patterns[i];
        if (toDelete.includes(pattern1.id)) continue;

        const similar: ContentPattern[] = [pattern1];

        for (let j = i + 1; j < patterns.length; j++) {
          const pattern2 = patterns[j];
          if (toDelete.includes(pattern2.id)) continue;

          // Check similarity (simplified - compare pattern strings)
          const similarity = this.calculatePatternSimilarity(pattern1.pattern, pattern2.pattern);
          
          if (similarity >= similarityThreshold && 
              pattern1.patternType === pattern2.patternType && 
              pattern1.category === pattern2.category) {
            similar.push(pattern2);
            toDelete.push(pattern2.id);
          }
        }

        if (similar.length > 1) {
          // Merge patterns
          const mergedPattern = this.mergePatterns(similar);
          mergedPatterns.push(mergedPattern);
          toDelete.push(pattern1.id);
        }
      }

      // Delete old patterns and add merged ones
      if (toDelete.length > 0) {
        await this.table.bulkDelete(toDelete);
      }

      if (mergedPatterns.length > 0) {
        await this.table.bulkAdd(mergedPatterns);
      }

      return { success: true, data: toDelete.length };
    } catch (error) {
      return this.handleError(error, 'Failed to merge similar patterns');
    }
  }

  /**
   * Calculate similarity between two pattern strings
   */
  private calculatePatternSimilarity(pattern1: string, pattern2: string): number {
    const words1 = new Set(pattern1.toLowerCase().split(/\s+/));
    const words2 = new Set(pattern2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Merge multiple similar patterns into one
   */
  private mergePatterns(patterns: ContentPattern[]): ContentPattern {
    // Combine all unique words from patterns
    const allWords = new Set<string>();
    let totalConfidence = 0;
    let totalSuccessRate = 0;
    const allExamples: string[] = [];

    for (const pattern of patterns) {
      const words = pattern.pattern.toLowerCase().split(/\s+/);
      words.forEach(word => allWords.add(word));
      totalConfidence += pattern.confidence;
      totalSuccessRate += pattern.successRate;
      allExamples.push(...pattern.examples);
    }

    // Create merged pattern
    return {
      id: patterns[0].id, // Keep first pattern's ID
      pattern: Array.from(allWords).join(' '),
      patternType: patterns[0].patternType,
      category: patterns[0].category,
      confidence: totalConfidence / patterns.length,
      examples: [...new Set(allExamples)].slice(0, 5), // Remove duplicates, limit to 5
      createdAt: patterns[0].createdAt,
      successRate: totalSuccessRate / patterns.length
    };
  }

  /**
   * Validate pattern before creation
   */
  async validatePattern(pattern: Omit<ContentPattern, 'id' | 'createdAt'>): Promise<Result<void>> {
    try {
      // Check if pattern already exists
      const existing = await this.table
        .where('pattern')
        .equals(pattern.pattern)
        .and(p => p.patternType === pattern.patternType && p.category === pattern.category)
        .first();

      if (existing) {
        return { success: false, error: new Error('Pattern already exists') };
      }

      // Validate pattern format based on type
      if (pattern.patternType === 'regex') {
        try {
          new RegExp(pattern.pattern);
        } catch {
          return { success: false, error: new Error('Invalid regex pattern') };
        }
      }

      // Validate confidence and success rate
      if (pattern.confidence < 0 || pattern.confidence > 1) {
        return { success: false, error: new Error('Confidence must be between 0 and 1') };
      }

      if (pattern.successRate < 0 || pattern.successRate > 1) {
        return { success: false, error: new Error('Success rate must be between 0 and 1') };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return this.handleError(error, 'Failed to validate pattern');
    }
  }

  /**
   * Validate ContentPattern entity
   */
  protected async validateEntity(pattern: ContentPattern): Promise<void> {
    // Validate required fields
    if (!pattern.pattern || pattern.pattern.trim().length === 0) {
      throw new ValidationError('Pattern is required', 'pattern');
    }

    if (pattern.pattern.length > 1000) {
      throw new ValidationError('Pattern must be less than 1000 characters', 'pattern');
    }

    // Validate pattern type
    const validPatternTypes: PatternType[] = ['keyword', 'regex', 'semantic'];
    if (!validPatternTypes.includes(pattern.patternType)) {
      throw new ValidationError('Invalid pattern type', 'patternType');
    }

    // Validate category
    const validCategories: CaseClassification[] = ['error', 'query', 'feature_request', 'general', 'technical', 'bug'];
    if (!validCategories.includes(pattern.category)) {
      throw new ValidationError('Invalid category', 'category');
    }

    // Validate confidence range
    if (pattern.confidence < 0 || pattern.confidence > 1) {
      throw new ValidationError('Confidence must be between 0 and 1', 'confidence');
    }

    // Validate success rate range
    if (pattern.successRate < 0 || pattern.successRate > 1) {
      throw new ValidationError('Success rate must be between 0 and 1', 'successRate');
    }

    // Validate examples array
    if (pattern.examples.length > 10) {
      throw new ValidationError('Maximum 10 examples allowed per pattern', 'examples');
    }

    for (const example of pattern.examples) {
      if (example.length > 500) {
        throw new ValidationError('Individual examples must be less than 500 characters', 'examples');
      }
    }

    // Validate regex patterns if applicable
    if (pattern.patternType === 'regex') {
      try {
        new RegExp(pattern.pattern);
      } catch {
        throw new ValidationError('Invalid regex pattern syntax', 'pattern');
      }
    }
  }

  /**
   * Handle database errors consistently
   */
  protected handleError(error: any, message: string): Result<any, DatabaseError> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: new DatabaseError(`${message}: ${errorMessage}`)
    };
  }
}

// Export singleton instance
export const contentPatternRepository = new ContentPatternRepository();