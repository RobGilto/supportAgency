import { PasteEvent, Result } from '@/types';
import { contentDetectionEngine } from './contentDetectionEngine';

export interface ClipboardPermissionResult {
  granted: boolean;
  error?: string;
}

export interface PasteEventListener {
  (event: PasteEvent): void;
}

export class ClipboardService {
  private listeners: Set<PasteEventListener> = new Set();
  private isListening = false;
  private permissionGranted = false;

  /**
   * Check if clipboard API is supported
   */
  isClipboardSupported(): boolean {
    return !!(navigator.clipboard && window.ClipboardEvent);
  }

  /**
   * Request clipboard read permission
   */
  async requestPermission(): Promise<ClipboardPermissionResult> {
    if (!this.isClipboardSupported()) {
      return {
        granted: false,
        error: 'Clipboard API not supported in this browser'
      };
    }

    try {
      // For modern browsers, try to request permission
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
        
        if (permission.state === 'granted') {
          this.permissionGranted = true;
          return { granted: true };
        } else if (permission.state === 'prompt') {
          // Permission will be requested on first clipboard access
          this.permissionGranted = true;
          return { granted: true };
        } else {
          return {
            granted: false,
            error: 'Clipboard access denied by user'
          };
        }
      }

      // Fallback: assume permission granted (will fail on first access if not)
      this.permissionGranted = true;
      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Permission request failed'
      };
    }
  }

  /**
   * Read content from clipboard
   */
  async readClipboard(): Promise<Result<string>> {
    if (!this.isClipboardSupported()) {
      return {
        success: false,
        error: new Error('Clipboard API not supported')
      };
    }

    try {
      const text = await navigator.clipboard.readText();
      return { success: true, data: text };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to read clipboard')
      };
    }
  }

  /**
   * Write content to clipboard
   */
  async writeClipboard(text: string): Promise<Result<void>> {
    if (!this.isClipboardSupported()) {
      return {
        success: false,
        error: new Error('Clipboard API not supported')
      };
    }

    try {
      await navigator.clipboard.writeText(text);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to write to clipboard')
      };
    }
  }

  /**
   * Process paste event from DOM
   */
  async processPasteEvent(event: ClipboardEvent): Promise<Result<PasteEvent>> {
    try {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return {
          success: false,
          error: new Error('No clipboard data available')
        };
      }

      // Try to get text content
      let content = clipboardData.getData('text/plain');
      
      // If no text, try to get HTML content
      if (!content) {
        content = clipboardData.getData('text/html');
      }

      // Check for images
      const files = Array.from(clipboardData.files);
      if (files.length > 0 && !content) {
        // Handle image files
        const imageFile = files.find(file => file.type.startsWith('image/'));
        if (imageFile) {
          content = await this.fileToDataUrl(imageFile);
        }
      }

      if (!content) {
        return {
          success: false,
          error: new Error('No readable content in clipboard')
        };
      }

      // Create paste event using content detection engine
      const pasteResult = await contentDetectionEngine.createPasteEvent(content, 'clipboard');
      return pasteResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to process paste event')
      };
    }
  }

  /**
   * Convert file to data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Add paste event listener
   */
  addEventListener(listener: PasteEventListener): void {
    this.listeners.add(listener);
    
    if (!this.isListening) {
      this.startListening();
    }
  }

  /**
   * Remove paste event listener
   */
  removeEventListener(listener: PasteEventListener): void {
    this.listeners.delete(listener);
    
    if (this.listeners.size === 0) {
      this.stopListening();
    }
  }

  /**
   * Start listening for paste events globally
   */
  private startListening(): void {
    if (this.isListening) return;

    const handlePaste = async (event: ClipboardEvent) => {
      // Only process if we have listeners
      if (this.listeners.size === 0) return;

      const target = event.target as Element;
      const isValidTarget = this.isPasteTargetValid(target);
      
      console.log('Paste event detected:', {
        target: target.tagName,
        isValidTarget,
        hasPageMarker: !!document.querySelector('body[data-paste-page], html[data-paste-page], [data-paste-page-root]'),
        hasPasteArea: !!target.closest('.paste-area, [data-paste-enabled]')
      });

      if (!isValidTarget) return;

      const pasteResult = await this.processPasteEvent(event);
      if (pasteResult.success) {
        // Notify all listeners
        this.listeners.forEach(listener => {
          try {
            listener(pasteResult.data);
          } catch (error) {
            console.error('Error in paste event listener:', error);
          }
        });
      } else {
        console.error('Failed to process paste event:', pasteResult.error);
      }
    };

    document.addEventListener('paste', handlePaste);
    this.isListening = true;
  }

  /**
   * Stop listening for paste events
   */
  private stopListening(): void {
    if (!this.isListening) return;

    // Remove the global paste listener
    // Note: We can't remove the specific handler, so we rely on the listener count check
    this.isListening = false;
  }

  /**
   * Check if paste target is valid (inside a paste area)
   */
  private isPasteTargetValid(target: Element): boolean {
    // Check if target or parent has paste area class
    const pasteArea = target.closest('.paste-area, [data-paste-enabled]');
    if (pasteArea) return true;
    
    // Check if the page itself is marked as a paste-enabled page (for page-wide paste)
    const pageRoot = document.querySelector('body[data-paste-page], html[data-paste-page], [data-paste-page-root]');
    return !!pageRoot;
  }

  /**
   * Manually trigger paste analysis from current clipboard
   */
  async analyzePaste(): Promise<Result<PasteEvent>> {
    const clipboardResult = await this.readClipboard();
    if (!clipboardResult.success) {
      return { success: false, error: clipboardResult.error };
    }

    return await contentDetectionEngine.createPasteEvent(clipboardResult.data, 'clipboard');
  }

  /**
   * Check if paste functionality is available
   */
  async checkAvailability(): Promise<{
    supported: boolean;
    permission: boolean;
    ready: boolean;
  }> {
    const supported = this.isClipboardSupported();
    let permission = this.permissionGranted;

    if (!permission && supported) {
      const permResult = await this.requestPermission();
      permission = permResult.granted;
    }

    return {
      supported,
      permission,
      ready: supported && permission
    };
  }

  /**
   * Process multiple paste events in batch
   */
  async processBatchPaste(contents: string[]): Promise<Result<PasteEvent[]>> {
    if (contents.length === 0) {
      return {
        success: false,
        error: new Error('No content provided for batch processing')
      };
    }

    try {
      const startTime = performance.now();
      
      // Process all contents in parallel
      const promises = contents.map(content => 
        contentDetectionEngine.createPasteEvent(content, 'clipboard')
      );
      
      const results = await Promise.all(promises);
      const processingTime = performance.now() - startTime;
      
      // Separate successful and failed results
      const successful: PasteEvent[] = [];
      const errors: Error[] = [];
      
      results.forEach(result => {
        if (result.success) {
          successful.push(result.data);
        } else {
          errors.push(result.error);
        }
      });
      
      console.log(`Batch paste processed: ${successful.length}/${contents.length} successful in ${processingTime.toFixed(2)}ms`);
      
      if (successful.length === 0) {
        return {
          success: false,
          error: new Error(`All batch paste operations failed. First error: ${errors[0]?.message}`)
        };
      }
      
      // Return successful results even if some failed
      return { success: true, data: successful };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Batch paste processing failed')
      };
    }
  }

  /**
   * Handle multiple clipboard formats simultaneously
   */
  async processMultiFormatPaste(clipboardData: DataTransfer): Promise<Result<PasteEvent[]>> {
    try {
      const pasteEvents: PasteEvent[] = [];
      const formats = ['text/plain', 'text/html'];
      
      // Process each available format
      for (const format of formats) {
        const content = clipboardData.getData(format);
        if (content && content.trim()) {
          const pasteResult = await contentDetectionEngine.createPasteEvent(content, 'clipboard');
          if (pasteResult.success) {
            pasteEvents.push(pasteResult.data);
          }
        }
      }
      
      // Process any files
      const files = Array.from(clipboardData.files);
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await this.fileToDataUrl(file);
          const pasteResult = await contentDetectionEngine.createPasteEvent(dataUrl, 'clipboard');
          if (pasteResult.success) {
            pasteEvents.push(pasteResult.data);
          }
        }
      }
      
      if (pasteEvents.length === 0) {
        return {
          success: false,
          error: new Error('No processable content found in clipboard')
        };
      }
      
      return { success: true, data: pasteEvents };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Multi-format paste processing failed')
      };
    }
  }

  /**
   * Get clipboard service status
   */
  getStatus(): {
    isListening: boolean;
    listenersCount: number;
    permissionGranted: boolean;
    supported: boolean;
  } {
    return {
      isListening: this.isListening,
      listenersCount: this.listeners.size,
      permissionGranted: this.permissionGranted,
      supported: this.isClipboardSupported()
    };
  }
}

// Export singleton instance
export const clipboardService = new ClipboardService();