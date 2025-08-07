import { create } from 'zustand';
import { PasteEvent, PasteAction, InboxItem, Case, Result } from '@/types';
import { caseRepository } from '@/services/repositories/CaseRepository';
import { generateUUID } from '@/utils/generators';
import { patternMatchingService } from '@/services/patternMatchingService';

interface PasteStore {
  // State
  recentPastes: PasteEvent[];
  isProcessingAction: boolean;
  error: string | null;

  // Actions
  addPasteEvent: (pasteEvent: PasteEvent) => void;
  executeAction: (action: PasteAction, pasteEvent: PasteEvent) => Promise<Result<any>>;
  clearRecentPastes: () => void;
  removePasteEvent: (pasteEventId: string) => void;
  setError: (error: string | null) => void;

  // Action handlers
  createCaseFromPaste: (pasteEvent: PasteEvent, actionData?: any) => Promise<Result<Case>>;
  addToInbox: (pasteEvent: PasteEvent) => Promise<Result<InboxItem>>;
  extractUrls: (pasteEvent: PasteEvent) => Promise<Result<string[]>>;
  analyzeLogs: (pasteEvent: PasteEvent) => Promise<Result<any>>;
  lookupCase: (pasteEvent: PasteEvent, actionData?: any) => Promise<Result<Case | null>>;
}

export const usePasteStore = create<PasteStore>((set, get) => ({
  // Initial state
  recentPastes: [],
  isProcessingAction: false,
  error: null,

  // Add a new paste event to recent history
  addPasteEvent: (pasteEvent: PasteEvent) => {
    set((state) => ({
      recentPastes: [pasteEvent, ...state.recentPastes.slice(0, 9)] // Keep last 10
    }));
  },

  // Execute a suggested action
  executeAction: async (action: PasteAction, pasteEvent: PasteEvent) => {
    set({ isProcessingAction: true, error: null });

    try {
      let result: Result<any>;

      switch (action.type) {
        case 'create_case':
          result = await get().createCaseFromPaste(pasteEvent, action.data);
          break;

        case 'lookup_case':
          result = await get().lookupCase(pasteEvent, action.data);
          break;

        case 'add_to_inbox':
          result = await get().addToInbox(pasteEvent);
          break;

        case 'extract_url':
          result = await get().extractUrls(pasteEvent);
          break;

        case 'analyze_logs':
          result = await get().analyzeLogs(pasteEvent);
          break;

        case 'save_for_later':
          result = await get().addToInbox(pasteEvent);
          break;

        default:
          result = {
            success: false,
            error: new Error(`Unknown action type: ${action.type}`)
          };
      }

      if (!result.success) {
        set({ error: result.error.message });
      }

      set({ isProcessingAction: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action execution failed';
      set({ isProcessingAction: false, error: errorMessage });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage)
      };
    }
  },

  // Create case from paste event
  createCaseFromPaste: async (pasteEvent: PasteEvent, actionData?: any) => {
    try {
      // Check for similar cases and duplicates before creating
      const fingerprint = await patternMatchingService.createContentFingerprint(pasteEvent.content);
      
      if (fingerprint.success) {
        // Get existing cases for similarity analysis
        const allCasesResult = await caseRepository.findAll();
        
        if (allCasesResult.success) {
          // Check for duplicates
          const duplicateResult = await patternMatchingService.detectDuplicateContent(fingerprint.data, allCasesResult.data);
          if (duplicateResult.success && duplicateResult.data.length > 0) {
            // Mark as duplicate in metadata
            pasteEvent.metadata.duplicateContent = true;
            pasteEvent.metadata.similarCases = duplicateResult.data.map(c => ({
              caseId: c.id,
              caseNumber: c.caseNumber,
              similarity: 1.0, // Exact duplicate
              title: c.title
            }));
          }

          // Find similar cases
          const similarResult = await patternMatchingService.findSimilarContent(fingerprint.data, allCasesResult.data);
          if (similarResult.success && similarResult.data.length > 0) {
            pasteEvent.metadata.similarCases = similarResult.data.map(item => ({
              caseId: item.case.id,
              caseNumber: item.case.caseNumber,
              similarity: item.similarity.similarity,
              title: item.case.title
            }));
          }
        }
      }

      const caseData: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'> = {
        title: actionData?.title || pasteEvent.content.substring(0, 100).trim(),
        description: pasteEvent.content,
        status: 'pending',
        priority: actionData?.priority || 'medium',
        classification: actionData?.classification || 'general',
        tags: ['paste-generated'],
        artifacts: [],
        customerName: pasteEvent.metadata.customerInfo?.name,
      };

      // Add additional tags based on content type
      switch (pasteEvent.contentType) {
        case 'console_log':
          caseData.tags.push('console-error', 'technical');
          break;
        case 'support_request':
          caseData.tags.push('support-request');
          break;
        case 'url_link':
          caseData.tags.push('url-reference');
          break;
      }

      // Add pattern-based tags if available
      if (pasteEvent.metadata.patternMatches && pasteEvent.metadata.patternMatches.length > 0) {
        caseData.tags.push('pattern-matched');
        
        // Add category-specific tags based on pattern matches
        const categories = pasteEvent.metadata.patternMatches.map(pm => pm.pattern.toLowerCase());
        caseData.tags.push(...categories.slice(0, 3)); // Add top 3 pattern categories
      }

      // Add similarity tags if similar cases found
      if (pasteEvent.metadata.similarCases && pasteEvent.metadata.similarCases.length > 0) {
        caseData.tags.push('similar-cases-found');
        
        if (pasteEvent.metadata.duplicateContent) {
          caseData.tags.push('potential-duplicate');
        }
      }

      // Add urgency tag if high/critical
      if (pasteEvent.metadata.urgencyLevel && 
          ['high', 'critical'].includes(pasteEvent.metadata.urgencyLevel)) {
        caseData.tags.push(`urgency-${pasteEvent.metadata.urgencyLevel}`);
      }

      const result = await caseRepository.createCase(caseData);
      
      // Learn from successful case creation for pattern matching
      if (result.success && caseData.classification !== 'general') {
        await patternMatchingService.learnFromCategorization(
          pasteEvent.content, 
          caseData.classification as any,
          pasteEvent.confidence
        );
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create case')
      };
    }
  },

  // Add to inbox (for future implementation)
  addToInbox: async (pasteEvent: PasteEvent) => {
    try {
      // For now, create a mock inbox item
      // This will be implemented properly when InboxRepository is available
      const inboxItem: InboxItem = {
        id: generateUUID(),
        content: pasteEvent.content,
        contentType: pasteEvent.contentType as any,
        source: 'paste',
        pasteIntent: 'add_to_inbox',
        confidence: pasteEvent.confidence,
        createdAt: new Date(),
        metadata: pasteEvent.metadata || {}
      };

      // TODO: Save to IndexedDB inbox table when repository is available
      console.log('Added to inbox:', inboxItem);

      return { success: true, data: inboxItem };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to add to inbox')
      };
    }
  },

  // Extract and process URLs
  extractUrls: async (pasteEvent: PasteEvent) => {
    try {
      const urls = pasteEvent.metadata.urls || [];
      
      // TODO: Implement URL metadata extraction
      // For now, just return the URLs
      console.log('Extracted URLs:', urls);
      
      return { success: true, data: urls };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to extract URLs')
      };
    }
  },

  // Analyze console logs
  analyzeLogs: async (pasteEvent: PasteEvent) => {
    try {
      const analysisResult = {
        errorCount: pasteEvent.metadata.consoleErrors?.length || 0,
        technicalDetails: pasteEvent.metadata.technicalDetails,
        suggestedSolution: 'Check browser console and network tab for additional details'
      };

      console.log('Log analysis:', analysisResult);
      
      return { success: true, data: analysisResult };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to analyze logs')
      };
    }
  },

  // Clear recent pastes
  clearRecentPastes: () => {
    set({ recentPastes: [] });
  },

  // Remove specific paste event
  removePasteEvent: (pasteEventId: string) => {
    set((state) => ({
      recentPastes: state.recentPastes.filter(paste => paste.id !== pasteEventId)
    }));
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },

  // Look up case by case number
  lookupCase: async (pasteEvent: PasteEvent, actionData?: any) => {
    try {
      const caseNumber = actionData?.caseNumber || pasteEvent.metadata.caseNumbers?.[0];
      
      if (!caseNumber) {
        return {
          success: false,
          error: new Error('No case number provided for lookup')
        };
      }

      // Look up case by case number
      const lookupResult = await caseRepository.findByCaseNumber(caseNumber);
      
      if (!lookupResult.success) {
        return lookupResult;
      }

      if (lookupResult.data) {
        console.log('Found existing case:', lookupResult.data);
        return { success: true, data: lookupResult.data };
      } else {
        console.log('Case number not found:', caseNumber);
        return {
          success: true,
          data: null // Case number not found, but lookup was successful
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to lookup case')
      };
    }
  },
}));