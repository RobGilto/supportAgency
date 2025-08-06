import { create } from 'zustand';
import { PasteEvent, PasteAction, InboxItem, Case, Result } from '@/types';
import { caseRepository } from '@/services/repositories/CaseRepository';
import { generateUUID } from '@/utils/generators';

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
      const caseData: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'> = {
        title: actionData?.title || pasteEvent.content.substring(0, 100).trim(),
        description: pasteEvent.content,
        status: 'pending',
        priority: actionData?.priority || 'medium',
        classification: actionData?.classification || 'query',
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

      // Add urgency tag if high/critical
      if (pasteEvent.metadata.urgencyLevel && 
          ['high', 'critical'].includes(pasteEvent.metadata.urgencyLevel)) {
        caseData.tags.push(`urgency-${pasteEvent.metadata.urgencyLevel}`);
      }

      const result = await caseRepository.createCase(caseData);
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
}));