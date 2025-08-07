import { 
  Result, 
  ContentPattern, 
  CaseClassification, 
  ContentAnalysisResult,
  Case
} from '@/types';
import { generateUUID } from '@/utils/generators';
import { db } from '@/services/database';

export interface PatternMatch {
  pattern: ContentPattern;
  confidence: number;
  matchedText: string;
  matchType: 'exact' | 'partial' | 'semantic';
}

export interface SimilarityResult {
  similarity: number;
  confidence: number;
  reasons: string[];
  matchedPatterns: PatternMatch[];
}

export interface ContentFingerprint {
  id: string;
  hash: string;
  keywords: string[];
  entities: string[];
  structure: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    technicalTerms: number;
  };
  semanticTokens: string[];
}

export interface CategorySuggestion {
  category: CaseClassification;
  confidence: number;
  reasons: string[];
  matchedPatterns: PatternMatch[];
}

export class PatternMatchingService {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MIN_CONFIDENCE = 0.5;
  
  // Technical terms that indicate complexity
  private readonly technicalTerms = [
    'api', 'database', 'server', 'authentication', 'authorization', 'ssl', 'cors',
    'json', 'xml', 'http', 'https', 'endpoint', 'webhook', 'microservice',
    'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'deployment', 'configuration',
    'integration', 'middleware', 'cache', 'redis', 'mongodb', 'postgresql',
    'oauth', 'jwt', 'token', 'session', 'cookie', 'header', 'payload'
  ];

  // Common entities (names, emails, etc.)
  private readonly entityPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    url: /https?:\/\/[^\s]+/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    caseNumber: /\b\d{8}\b/g,
    version: /v?\d+\.\d+(?:\.\d+)?/g,
    uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
  };

  /**
   * Create a content fingerprint for similarity matching
   */
  async createContentFingerprint(content: string): Promise<Result<ContentFingerprint>> {
    try {
      const normalizedContent = content.toLowerCase().trim();
      
      // Extract keywords (remove common stop words)
      const keywords = this.extractKeywords(normalizedContent);
      
      // Extract entities
      const entities = this.extractEntities(content);
      
      // Calculate structure metrics
      const structure = this.calculateStructuralMetrics(content);
      
      // Create semantic tokens
      const semanticTokens = this.createSemanticTokens(keywords, entities);
      
      // Create hash for exact duplicate detection
      const hash = await this.createContentHash(normalizedContent);
      
      const fingerprint: ContentFingerprint = {
        id: generateUUID(),
        hash,
        keywords,
        entities,
        structure,
        semanticTokens
      };

      return { success: true, data: fingerprint };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create content fingerprint')
      };
    }
  }

  /**
   * Find similar content based on fingerprints
   */
  async findSimilarContent(fingerprint: ContentFingerprint, cases: Case[]): Promise<Result<Array<{ case: Case; similarity: SimilarityResult }>>> {
    try {
      const similarities: Array<{ case: Case; similarity: SimilarityResult }> = [];

      for (const existingCase of cases) {
        if (!existingCase.description) continue;
        
        const existingFingerprintResult = await this.createContentFingerprint(existingCase.description);
        if (!existingFingerprintResult.success) continue;

        const existingFingerprint = existingFingerprintResult.data;
        const similarity = this.calculateSimilarity(fingerprint, existingFingerprint);
        
        if (similarity.similarity >= this.SIMILARITY_THRESHOLD) {
          similarities.push({
            case: existingCase,
            similarity
          });
        }
      }

      // Sort by similarity score descending
      similarities.sort((a, b) => b.similarity.similarity - a.similarity.similarity);

      return { success: true, data: similarities };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to find similar content')
      };
    }
  }

  /**
   * Suggest content category based on patterns and analysis
   */
  async suggestCategory(analysis: ContentAnalysisResult, content: string): Promise<Result<CategorySuggestion[]>> {
    try {
      const suggestions: CategorySuggestion[] = [];
      
      // Get existing patterns from database
      const patterns = await db.contentPatterns.orderBy('confidence').reverse().toArray();
      
      // Match against existing patterns
      const patternMatches = this.matchPatterns(content, patterns);
      
      // Create suggestions based on pattern matches
      const patternSuggestions = this.createPatternBasedSuggestions(patternMatches);
      suggestions.push(...patternSuggestions);
      
      // Create heuristic-based suggestions
      const heuristicSuggestions = this.createHeuristicSuggestions(analysis, content);
      suggestions.push(...heuristicSuggestions);
      
      // Merge and deduplicate suggestions
      const mergedSuggestions = this.mergeSuggestions(suggestions);
      
      // Sort by confidence descending
      mergedSuggestions.sort((a, b) => b.confidence - a.confidence);
      
      return { success: true, data: mergedSuggestions.slice(0, 3) }; // Top 3 suggestions
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to suggest category')
      };
    }
  }

  /**
   * Learn from successful categorizations
   */
  async learnFromCategorization(content: string, actualCategory: CaseClassification, confidence: number): Promise<Result<ContentPattern>> {
    try {
      // Extract key patterns from the content
      const keyPatterns = this.extractLearningPatterns(content, actualCategory);
      
      if (keyPatterns.length === 0) {
        return { success: false, error: new Error('No learnable patterns found') };
      }

      // Create or update pattern
      const pattern: ContentPattern = {
        id: generateUUID(),
        pattern: keyPatterns[0], // Use the strongest pattern
        patternType: 'keyword',
        category: actualCategory,
        confidence,
        examples: [content.substring(0, 200)], // Store example snippet
        createdAt: new Date(),
        successRate: 1.0 // Initial success rate
      };

      await db.contentPatterns.add(pattern);
      
      return { success: true, data: pattern };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to learn from categorization')
      };
    }
  }

  /**
   * Update pattern success rates based on feedback
   */
  async updatePatternFeedback(patternId: string, wasCorrect: boolean): Promise<Result<void>> {
    try {
      const pattern = await db.contentPatterns.get(patternId);
      if (!pattern) {
        return { success: false, error: new Error('Pattern not found') };
      }

      // Update success rate using exponential moving average
      const alpha = 0.1; // Learning rate
      const newSuccessRate = wasCorrect 
        ? pattern.successRate + alpha * (1 - pattern.successRate)
        : pattern.successRate + alpha * (0 - pattern.successRate);

      await db.contentPatterns.update(patternId, {
        successRate: Math.max(0, Math.min(1, newSuccessRate))
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update pattern feedback')
      };
    }
  }

  /**
   * Detect duplicate content
   */
  async detectDuplicateContent(fingerprint: ContentFingerprint, cases: Case[]): Promise<Result<Case[]>> {
    try {
      const duplicates: Case[] = [];

      for (const existingCase of cases) {
        if (!existingCase.description) continue;
        
        const existingFingerprintResult = await this.createContentFingerprint(existingCase.description);
        if (!existingFingerprintResult.success) continue;

        const existingFingerprint = existingFingerprintResult.data;
        
        // Check for exact hash match (exact duplicate)
        if (fingerprint.hash === existingFingerprint.hash) {
          duplicates.push(existingCase);
          continue;
        }

        // Check for near-duplicate based on high similarity
        const similarity = this.calculateSimilarity(fingerprint, existingFingerprint);
        if (similarity.similarity >= 0.95) { // Very high threshold for duplicates
          duplicates.push(existingCase);
        }
      }

      return { success: true, data: duplicates };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to detect duplicate content')
      };
    }
  }

  /**
   * Calculate similarity between two content fingerprints
   */
  private calculateSimilarity(fingerprint1: ContentFingerprint, fingerprint2: ContentFingerprint): SimilarityResult {
    const reasons: string[] = [];
    const matchedPatterns: PatternMatch[] = [];
    let totalSimilarity = 0;
    let weightSum = 0;

    // Keyword similarity (40% weight)
    const keywordSim = this.calculateKeywordSimilarity(fingerprint1.keywords, fingerprint2.keywords);
    totalSimilarity += keywordSim * 0.4;
    weightSum += 0.4;
    if (keywordSim > 0.3) {
      reasons.push(`${Math.round(keywordSim * 100)}% keyword overlap`);
    }

    // Entity similarity (30% weight)
    const entitySim = this.calculateEntitySimilarity(fingerprint1.entities, fingerprint2.entities);
    totalSimilarity += entitySim * 0.3;
    weightSum += 0.3;
    if (entitySim > 0.2) {
      reasons.push(`${Math.round(entitySim * 100)}% entity overlap`);
    }

    // Structural similarity (20% weight)
    const structSim = this.calculateStructuralSimilarity(fingerprint1.structure, fingerprint2.structure);
    totalSimilarity += structSim * 0.2;
    weightSum += 0.2;
    if (structSim > 0.5) {
      reasons.push(`Similar structure (${Math.round(structSim * 100)}% match)`);
    }

    // Semantic similarity (10% weight)
    const semanticSim = this.calculateSemanticSimilarity(fingerprint1.semanticTokens, fingerprint2.semanticTokens);
    totalSimilarity += semanticSim * 0.1;
    weightSum += 0.1;
    if (semanticSim > 0.4) {
      reasons.push(`${Math.round(semanticSim * 100)}% semantic similarity`);
    }

    const finalSimilarity = weightSum > 0 ? totalSimilarity / weightSum : 0;
    const confidence = this.calculateConfidence(keywordSim, entitySim, structSim, semanticSim);

    return {
      similarity: finalSimilarity,
      confidence,
      reasons,
      matchedPatterns
    };
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 50); // Limit to top 50 keywords
  }

  /**
   * Extract entities from content
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];

    // Extract different entity types
    Object.entries(this.entityPatterns).forEach(([_type, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        entities.push(...matches);
      }
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Calculate structural metrics
   */
  private calculateStructuralMetrics(content: string) {
    const words = content.trim().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const technicalTermCount = words.filter(word => 
      this.technicalTerms.includes(word.toLowerCase())
    ).length;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      technicalTerms: technicalTermCount
    };
  }

  /**
   * Create semantic tokens for advanced matching
   */
  private createSemanticTokens(keywords: string[], entities: string[]): string[] {
    // Combine keywords and entities, then create semantic groups
    const tokens = [...keywords, ...entities];
    const semanticGroups: Record<string, string[]> = {
      error: ['error', 'exception', 'failure', 'bug', 'issue', 'problem'],
      data: ['data', 'database', 'table', 'record', 'field', 'query'],
      auth: ['login', 'authentication', 'authorization', 'user', 'password', 'token'],
      ui: ['interface', 'ui', 'button', 'form', 'page', 'screen', 'display'],
      api: ['api', 'endpoint', 'request', 'response', 'service', 'integration']
    };

    const semanticTokens: string[] = [];
    Object.entries(semanticGroups).forEach(([group, words]) => {
      if (tokens.some(token => words.includes(token))) {
        semanticTokens.push(group);
      }
    });

    return semanticTokens;
  }

  /**
   * Create content hash for duplicate detection
   */
  private async createContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Match content against existing patterns
   */
  private matchPatterns(content: string, patterns: ContentPattern[]): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of patterns) {
      let confidence = 0;
      let matchedText = '';
      let matchType: 'exact' | 'partial' | 'semantic' = 'partial';

      switch (pattern.patternType) {
        case 'keyword':
          const keywordMatch = this.matchKeywordPattern(content, pattern.pattern);
          if (keywordMatch.confidence > this.MIN_CONFIDENCE) {
            confidence = keywordMatch.confidence;
            matchedText = keywordMatch.matchedText;
            matchType = keywordMatch.isExact ? 'exact' : 'partial';
          }
          break;

        case 'regex':
          const regexMatch = this.matchRegexPattern(content, pattern.pattern);
          if (regexMatch.confidence > this.MIN_CONFIDENCE) {
            confidence = regexMatch.confidence;
            matchedText = regexMatch.matchedText;
            matchType = 'exact';
          }
          break;

        case 'semantic':
          const semanticMatch = this.matchSemanticPattern(content, pattern.pattern);
          if (semanticMatch.confidence > this.MIN_CONFIDENCE) {
            confidence = semanticMatch.confidence;
            matchedText = semanticMatch.matchedText;
            matchType = 'semantic';
          }
          break;
      }

      if (confidence > this.MIN_CONFIDENCE) {
        matches.push({
          pattern,
          confidence: confidence * pattern.successRate, // Weight by historical success
          matchedText,
          matchType
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Match keyword pattern
   */
  private matchKeywordPattern(content: string, pattern: string): { confidence: number; matchedText: string; isExact: boolean } {
    const keywords = pattern.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    }
    
    const confidence = keywords.length > 0 ? matches / keywords.length : 0;
    const isExact = matches === keywords.length;
    
    return {
      confidence,
      matchedText: matchedKeywords.join(', '),
      isExact
    };
  }

  /**
   * Match regex pattern
   */
  private matchRegexPattern(content: string, pattern: string): { confidence: number; matchedText: string } {
    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      
      return {
        confidence: matches ? 1.0 : 0.0,
        matchedText: matches ? matches.join(', ') : ''
      };
    } catch {
      return { confidence: 0, matchedText: '' };
    }
  }

  /**
   * Match semantic pattern (simplified - would use embeddings in production)
   */
  private matchSemanticPattern(content: string, pattern: string): { confidence: number; matchedText: string } {
    const patternTokens = this.createSemanticTokens(this.extractKeywords(pattern), []);
    const contentTokens = this.createSemanticTokens(this.extractKeywords(content), []);
    
    const overlap = patternTokens.filter(token => contentTokens.includes(token)).length;
    const confidence = patternTokens.length > 0 ? overlap / patternTokens.length : 0;
    
    return {
      confidence,
      matchedText: patternTokens.filter(token => contentTokens.includes(token)).join(', ')
    };
  }

  /**
   * Create suggestions based on pattern matches
   */
  private createPatternBasedSuggestions(patternMatches: PatternMatch[]): CategorySuggestion[] {
    const categoryGroups: Record<string, PatternMatch[]> = {};
    
    // Group patterns by category
    for (const match of patternMatches) {
      const category = match.pattern.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(match);
    }
    
    // Create suggestions from groups
    return Object.entries(categoryGroups).map(([category, matches]) => {
      const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
      const reasons = matches.map(m => `Pattern match: "${m.matchedText}" (${Math.round(m.confidence * 100)}%)`);
      
      return {
        category: category as CaseClassification,
        confidence: avgConfidence,
        reasons,
        matchedPatterns: matches
      };
    });
  }

  /**
   * Create heuristic-based suggestions
   */
  private createHeuristicSuggestions(analysis: ContentAnalysisResult, content: string): CategorySuggestion[] {
    const suggestions: CategorySuggestion[] = [];
    
    // Technical classification based on content analysis
    if (analysis.extractedData.technicalDetails || analysis.extractedData.consoleErrors) {
      suggestions.push({
        category: 'technical',
        confidence: 0.8,
        reasons: ['Contains technical details or console errors'],
        matchedPatterns: []
      });
    }
    
    // Bug classification based on error indicators
    if (analysis.contentType === 'console_log' || content.toLowerCase().includes('error')) {
      suggestions.push({
        category: 'bug',
        confidence: 0.7,
        reasons: ['Contains error logs or bug-related language'],
        matchedPatterns: []
      });
    }
    
    // General classification for support requests
    if (analysis.contentType === 'support_request') {
      suggestions.push({
        category: 'general',
        confidence: 0.6,
        reasons: ['Identified as general support request'],
        matchedPatterns: []
      });
    }
    
    return suggestions;
  }

  /**
   * Merge duplicate category suggestions
   */
  private mergeSuggestions(suggestions: CategorySuggestion[]): CategorySuggestion[] {
    const merged: Record<string, CategorySuggestion> = {};
    
    for (const suggestion of suggestions) {
      const key = suggestion.category;
      
      if (!merged[key]) {
        merged[key] = suggestion;
      } else {
        // Merge with existing suggestion
        merged[key].confidence = Math.max(merged[key].confidence, suggestion.confidence);
        merged[key].reasons.push(...suggestion.reasons);
        merged[key].matchedPatterns.push(...suggestion.matchedPatterns);
      }
    }
    
    return Object.values(merged);
  }

  /**
   * Extract learning patterns from successful categorizations
   */
  private extractLearningPatterns(content: string, _category: CaseClassification): string[] {
    const keywords = this.extractKeywords(content);
    const entities = this.extractEntities(content);
    
    // Extract most significant keywords (those that appear multiple times or are technical terms)
    const significantKeywords = keywords.filter(keyword => 
      this.technicalTerms.includes(keyword) || 
      keywords.filter(k => k === keyword).length > 1
    );
    
    const patterns: string[] = [];
    
    // Create keyword patterns
    if (significantKeywords.length > 0) {
      patterns.push(significantKeywords.slice(0, 3).join(' ')); // Top 3 keywords
    }
    
    // Create entity-based patterns
    if (entities.length > 0) {
      patterns.push(entities.slice(0, 2).join(' ')); // Top 2 entities
    }
    
    return patterns;
  }

  /**
   * Calculate keyword similarity using Jaccard coefficient
   */
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate entity similarity
   */
  private calculateEntitySimilarity(entities1: string[], entities2: string[]): number {
    return this.calculateKeywordSimilarity(entities1, entities2);
  }

  /**
   * Calculate structural similarity
   */
  private calculateStructuralSimilarity(struct1: any, struct2: any): number {
    const wordCountSim = 1 - Math.abs(struct1.wordCount - struct2.wordCount) / Math.max(struct1.wordCount, struct2.wordCount, 1);
    const sentenceCountSim = 1 - Math.abs(struct1.sentenceCount - struct2.sentenceCount) / Math.max(struct1.sentenceCount, struct2.sentenceCount, 1);
    const techTermSim = 1 - Math.abs(struct1.technicalTerms - struct2.technicalTerms) / Math.max(struct1.technicalTerms, struct2.technicalTerms, 1);
    
    return (wordCountSim + sentenceCountSim + techTermSim) / 3;
  }

  /**
   * Calculate semantic similarity
   */
  private calculateSemanticSimilarity(tokens1: string[], tokens2: string[]): number {
    return this.calculateKeywordSimilarity(tokens1, tokens2);
  }

  /**
   * Calculate overall confidence based on similarity metrics
   */
  private calculateConfidence(keywordSim: number, entitySim: number, structSim: number, semanticSim: number): number {
    // Higher confidence when multiple similarity metrics agree
    const metrics = [keywordSim, entitySim, structSim, semanticSim];
    const highMetrics = metrics.filter(m => m > 0.5).length;
    
    return Math.min(0.9, 0.3 + (highMetrics * 0.15)); // Base confidence + bonus for agreeing metrics
  }
}

// Export singleton instance
export const patternMatchingService = new PatternMatchingService();