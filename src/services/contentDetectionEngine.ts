import { 
  PasteEvent, 
  PasteAction, 
  PasteMetadata, 
  ContentAnalysisResult, 
  DetectedContentType, 
  CaseClassification, 
  CasePriority,
  UrgencyLevel,
  ConsoleLogEntry,
  TechnicalInfo,
  CustomerInfo,
  Result
} from '@/types';
import { generateUUID } from '@/utils/generators';
import { patternMatchingService, CategorySuggestion } from '@/services/patternMatchingService';

export class ContentDetectionEngine {
  private readonly urlRegex = /https?:\/\/[^\s]+/g;
  private readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private readonly caseNumberRegex = /\b\d{8}\b/g; // 8-digit case numbers like 05908032
  private readonly caseNumberPatterns = [
    /^(\d{8})$/,  // Exact 8-digit match
    /\bcase\s*#?\s*(\d{8})\b/i,  // "case 05908032" or "case #05908032"
    /\b#(\d{8})\b/,  // "#05908032"
    /\bticket\s*#?\s*(\d{8})\b/i,  // "ticket 05908032"
  ];
  private readonly consoleErrorPatterns = [
    /^Uncaught\s+/i,
    /^Error:/i,
    /^\s*at\s+/i,
    /console\.error/i,
    /TypeError:/i,
    /ReferenceError:/i,
    /SyntaxError:/i,
    /RangeError:/i
  ];
  
  private readonly supportRequestPatterns = [
    /\b(help|issue|problem|error|bug|broken|not working|can't|cannot|unable)\b/i,
    /\b(support|assistance|stuck|confused|question)\b/i,
    /\b(fix|solve|resolve|debug)\b/i,
    /\b(dashboard|report|data|chart|visualization)\b/i
  ];

  private readonly urgencyIndicators = {
    critical: [/\b(critical|urgent|emergency|down|outage|broken)\b/i, /\b(can't access|completely broken|system down)\b/i],
    high: [/\b(important|asap|priority|blocking)\b/i, /\b(customer facing|production)\b/i],
    medium: [/\b(should|would like|when possible)\b/i],
    low: [/\b(minor|small|enhancement|suggestion)\b/i]
  };

  /**
   * Analyze pasted content and return detailed analysis
   */
  async analyzeContent(content: string, _source: 'clipboard' | 'drag-drop' | 'file-upload' = 'clipboard'): Promise<Result<ContentAnalysisResult>> {
    const startTime = performance.now();
    
    try {
      // Detect content type
      const contentType = this.detectContentType(content);
      
      // Extract metadata
      const metadata = await this.extractMetadata(content, contentType);
      
      // Determine initial classification and priority
      let classification = this.classifyContent(content, metadata);
      const priority = this.assessPriority(content, metadata);
      let confidence = this.calculateConfidence(content, contentType, metadata);
      
      // Enhance classification with pattern matching
      const analysis: ContentAnalysisResult = {
        contentType,
        confidence,
        classification,
        priority,
        suggestedTitle: '',
        extractedData: metadata,
        processingTime: 0
      };
      
      const categorySuggestions = await patternMatchingService.suggestCategory(analysis, content);
      if (categorySuggestions.success && categorySuggestions.data.length > 0) {
        const topSuggestion = categorySuggestions.data[0];
        
        // Use pattern-based classification if confidence is higher
        if (topSuggestion.confidence > confidence) {
          classification = topSuggestion.category;
          confidence = Math.max(confidence, topSuggestion.confidence);
          
          // Add pattern match info to metadata
          metadata.patternMatches = topSuggestion.matchedPatterns.map(pm => ({
            pattern: pm.pattern.pattern,
            confidence: pm.confidence,
            matchType: pm.matchType
          }));
        }
      }
      
      // Generate suggested title
      const suggestedTitle = this.generateTitle(content, contentType, metadata);
      
      const processingTime = performance.now() - startTime;
      
      return {
        success: true,
        data: {
          contentType,
          confidence,
          classification,
          priority,
          suggestedTitle,
          extractedData: metadata,
          processingTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Content analysis failed')
      };
    }
  }

  /**
   * Create a paste event from clipboard data
   */
  async createPasteEvent(content: string, source: 'clipboard' | 'drag-drop' | 'file-upload' = 'clipboard'): Promise<Result<PasteEvent>> {
    try {
      const analysisResult = await this.analyzeContent(content, source);
      if (!analysisResult.success) {
        return { success: false, error: analysisResult.error };
      }

      const analysis = analysisResult.data;
      const suggestedActions = this.generateSuggestedActions(analysis);

      const pasteEvent: PasteEvent = {
        id: generateUUID(),
        content,
        contentType: analysis.contentType,
        timestamp: new Date(),
        source,
        confidence: analysis.confidence,
        suggestedActions,
        metadata: analysis.extractedData
      };

      return { success: true, data: pasteEvent };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create paste event')
      };
    }
  }

  /**
   * Detect the primary content type
   */
  private detectContentType(content: string): DetectedContentType {
    const trimmedContent = content.trim();
    
    // Check for case numbers first (most specific)
    if (this.isCaseNumber(trimmedContent)) {
      return 'case_number';
    }
    
    // Check for images (data URLs)
    if (trimmedContent.startsWith('data:image/')) {
      return 'image';
    }
    
    // Check for console logs
    if (this.isConsoleLog(trimmedContent)) {
      return 'console_log';
    }
    
    // Check for URLs
    const urls = trimmedContent.match(this.urlRegex);
    if (urls && urls.length > 0) {
      // If content is mostly URLs, classify as url_link
      if (urls.join(' ').length > trimmedContent.length * 0.5) {
        return 'url_link';
      }
    }
    
    // Check for support request patterns
    if (this.isSupportRequest(trimmedContent)) {
      return 'support_request';
    }
    
    // Check for mixed content (multiple types detected)
    const hasUrls = urls && urls.length > 0;
    const hasErrors = this.hasConsoleErrors(trimmedContent);
    const hasSupportLanguage = this.hasSupportRequestLanguage(trimmedContent);
    const hasCaseNumbers = this.extractCaseNumbers(trimmedContent).length > 0;
    
    if ([hasUrls, hasErrors, hasSupportLanguage, hasCaseNumbers].filter(Boolean).length > 1) {
      return 'mixed_content';
    }
    
    return 'plain_text';
  }

  /**
   * Extract metadata from content based on type
   */
  private async extractMetadata(content: string, _contentType: DetectedContentType): Promise<PasteMetadata> {
    const metadata: PasteMetadata = {};
    
    // Extract case numbers
    const caseNumbers = this.extractCaseNumbers(content);
    if (caseNumbers.length > 0) {
      metadata.caseNumbers = caseNumbers;
    }
    
    // Extract URLs
    const urls = content.match(this.urlRegex);
    if (urls && urls.length > 0) {
      metadata.urls = urls;
    }
    
    // Extract console errors
    const consoleErrors = this.extractConsoleErrors(content);
    if (consoleErrors.length > 0) {
      metadata.consoleErrors = consoleErrors;
    }
    
    // Extract technical information
    const technicalInfo = this.extractTechnicalInfo(content);
    if (Object.keys(technicalInfo).length > 0) {
      metadata.technicalDetails = technicalInfo;
    }
    
    // Extract customer information
    const customerInfo = this.extractCustomerInfo(content);
    if (customerInfo) {
      metadata.customerInfo = customerInfo;
    }
    
    // Assess urgency level
    metadata.urgencyLevel = this.assessUrgencyLevel(content);
    
    return metadata;
  }

  /**
   * Check if content appears to be console output
   */
  private isConsoleLog(content: string): boolean {
    const lines = content.split('\n');
    const errorLineCount = lines.filter(line => 
      this.consoleErrorPatterns.some(pattern => pattern.test(line))
    ).length;
    
    return errorLineCount > 0 && errorLineCount / lines.length > 0.3;
  }

  /**
   * Check if content contains console errors
   */
  private hasConsoleErrors(content: string): boolean {
    return this.consoleErrorPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content appears to be a support request
   */
  private isSupportRequest(content: string): boolean {
    const matchCount = this.supportRequestPatterns.filter(pattern => 
      pattern.test(content)
    ).length;
    
    return matchCount >= 2 || content.length > 50;
  }

  /**
   * Check if content has support request language
   */
  private hasSupportRequestLanguage(content: string): boolean {
    return this.supportRequestPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content appears to be a case number
   */
  private isCaseNumber(content: string): boolean {
    const trimmed = content.trim();
    
    // Check if it's a pure 8-digit number
    if (/^\d{8}$/.test(trimmed)) {
      return true;
    }
    
    // Check for case number patterns
    return this.caseNumberPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Extract case numbers from content
   */
  private extractCaseNumbers(content: string): string[] {
    const caseNumbers: string[] = [];
    
    // Extract using all patterns
    for (const pattern of this.caseNumberPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Extract the captured group (the actual number)
        const caseNumber = matches[1] || matches[0];
        if (caseNumber && /^\d{8}$/.test(caseNumber)) {
          caseNumbers.push(caseNumber);
        }
      }
    }
    
    // Also check for standalone 8-digit numbers
    const standaloneMatches = content.match(this.caseNumberRegex);
    if (standaloneMatches) {
      caseNumbers.push(...standaloneMatches);
    }
    
    // Remove duplicates and return
    return [...new Set(caseNumbers)];
  }

  /**
   * Extract console error entries
   */
  private extractConsoleErrors(content: string): ConsoleLogEntry[] {
    const errors: ConsoleLogEntry[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (this.consoleErrorPatterns.some(pattern => pattern.test(line))) {
        const level = this.determineLogLevel(line);
        errors.push({
          level,
          message: line.trim(),
          timestamp: new Date(),
          source: 'console'
        });
      }
    }
    
    return errors;
  }

  /**
   * Determine log level from line content
   */
  private determineLogLevel(line: string): 'error' | 'warn' | 'info' | 'debug' {
    if (/error|uncaught|exception/i.test(line)) return 'error';
    if (/warn/i.test(line)) return 'warn';
    if (/info/i.test(line)) return 'info';
    return 'debug';
  }

  /**
   * Extract technical information
   */
  private extractTechnicalInfo(content: string): TechnicalInfo {
    const info: TechnicalInfo = {};
    
    // Browser detection
    const browserMatch = content.match(/(Chrome|Firefox|Safari|Edge|Opera)[\s\/][\d\.]+/i);
    if (browserMatch) {
      info.browser = browserMatch[0];
    }
    
    // OS detection
    const osMatch = content.match(/(Windows|macOS|Linux|iOS|Android)[\s\d\.]*/i);
    if (osMatch) {
      info.os = osMatch[0];
    }
    
    // Error messages
    const errorMessages = content.match(/Error:\s*[^\n]+/g);
    if (errorMessages) {
      info.errorMessages = errorMessages;
    }
    
    // Stack traces
    const stackTraces = content.match(/\s+at\s+[^\n]+/g);
    if (stackTraces) {
      info.stackTraces = stackTraces;
    }
    
    return info;
  }

  /**
   * Extract customer information from content
   */
  private extractCustomerInfo(content: string): CustomerInfo | null {
    const emails = content.match(this.emailRegex);
    const nameMatches = content.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
    
    if (!emails && !nameMatches) {
      return null;
    }
    
    return {
      email: emails?.[0],
      name: nameMatches?.[0],
      detectionConfidence: emails ? 0.8 : 0.6
    };
  }

  /**
   * Assess urgency level from content
   */
  private assessUrgencyLevel(content: string): UrgencyLevel {
    for (const [level, patterns] of Object.entries(this.urgencyIndicators)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return level as UrgencyLevel;
      }
    }
    return 'medium';
  }

  /**
   * Classify content for case creation
   */
  private classifyContent(content: string, metadata: PasteMetadata): CaseClassification {
    if (metadata.consoleErrors && metadata.consoleErrors.length > 0) {
      return 'error';
    }
    
    if (/\b(feature|enhancement|improvement|add|new)\b/i.test(content)) {
      return 'feature_request';
    }
    
    return 'query';
  }

  /**
   * Assess priority based on content and metadata
   */
  private assessPriority(_content: string, metadata: PasteMetadata): CasePriority {
    if (metadata.urgencyLevel === 'critical') return 'urgent';
    if (metadata.urgencyLevel === 'high') return 'high';
    if (metadata.urgencyLevel === 'low') return 'low';
    
    // Default based on classification
    if (metadata.consoleErrors && metadata.consoleErrors.length > 0) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(content: string, contentType: DetectedContentType, metadata: PasteMetadata): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on detected patterns
    if (contentType === 'console_log' && metadata.consoleErrors?.length) {
      confidence += 0.3;
    }
    
    if (contentType === 'support_request' && this.isSupportRequest(content)) {
      confidence += 0.2;
    }
    
    if (metadata.urls && metadata.urls.length > 0) {
      confidence += 0.1;
    }
    
    if (metadata.customerInfo && metadata.customerInfo.detectionConfidence > 0.7) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate a suggested title for the content
   */
  private generateTitle(content: string, contentType: DetectedContentType, metadata: PasteMetadata): string {
    const truncatedContent = content.substring(0, 100).trim();
    
    switch (contentType) {
      case 'case_number':
        if (metadata.caseNumbers && metadata.caseNumbers.length > 0) {
          return `Case Reference: ${metadata.caseNumbers[0]}`;
        }
        return 'Case Number';
        
      case 'console_log':
        if (metadata.consoleErrors && metadata.consoleErrors.length > 0) {
          return `Console Error: ${metadata.consoleErrors[0].message.substring(0, 50)}`;
        }
        return 'Console Log Analysis';
        
      case 'support_request':
        // Extract first sentence or meaningful phrase
        const firstSentence = truncatedContent.split(/[.!?]/)[0];
        return firstSentence.length > 10 ? firstSentence : 'Support Request';
        
      case 'url_link':
        if (metadata.urls && metadata.urls.length > 0) {
          const domain = metadata.urls[0].match(/https?:\/\/([^\/]+)/)?.[1] || 'Link';
          return `Shared Link: ${domain}`;
        }
        return 'Shared Link';
        
      case 'mixed_content':
        return 'Mixed Content Analysis';
        
      default:
        return truncatedContent || 'Pasted Content';
    }
  }

  /**
   * Generate suggested actions based on analysis
   */
  private generateSuggestedActions(analysis: ContentAnalysisResult): PasteAction[] {
    const actions: PasteAction[] = [];
    
    // Always offer to save for later
    actions.push({
      id: generateUUID(),
      type: 'save_for_later',
      label: 'Save to Inbox',
      description: 'Save this content for later review',
      confidence: 1.0
    });
    
    // Content-specific actions
    switch (analysis.contentType) {
      case 'case_number':
        // Add case lookup action
        actions.unshift({
          id: generateUUID(),
          type: 'lookup_case',
          label: 'Look Up Case',
          description: 'Find and open this existing case',
          confidence: 0.95,
          data: {
            caseNumber: analysis.extractedData.caseNumbers?.[0]
          }
        });
        // Also offer to create a new case with this number as reference
        actions.push({
          id: generateUUID(),
          type: 'create_case',
          label: 'Create Related Case',
          description: 'Create a new case referencing this case number',
          confidence: 0.7,
          data: {
            relatedCaseNumber: analysis.extractedData.caseNumbers?.[0]
          }
        });
        break;
        
      case 'support_request':
        actions.unshift({
          id: generateUUID(),
          type: 'create_case',
          label: 'Create Case',
          description: 'Create a new support case from this content',
          confidence: analysis.confidence,
          data: {
            title: analysis.suggestedTitle,
            classification: analysis.classification,
            priority: analysis.priority
          }
        });
        break;
        
      case 'console_log':
        actions.unshift({
          id: generateUUID(),
          type: 'analyze_logs',
          label: 'Analyze Logs',
          description: 'Extract technical details from console output',
          confidence: analysis.confidence
        });
        break;
        
      case 'url_link':
        actions.unshift({
          id: generateUUID(),
          type: 'extract_url',
          label: 'Extract Link Info',
          description: 'Fetch metadata from the shared URL',
          confidence: 0.9
        });
        break;
        
      case 'image':
        actions.unshift({
          id: generateUUID(),
          type: 'process_image',
          label: 'Process Image',
          description: 'Add image to gallery and extract metadata',
          confidence: 0.95
        });
        break;
    }
    
    return actions.sort((a, b) => b.confidence - a.confidence);
  }
}

// Export singleton instance
export const contentDetectionEngine = new ContentDetectionEngine();