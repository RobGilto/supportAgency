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
      // Only process if we have listeners and clipboard is inside a paste area
      if (this.listeners.size === 0) return;

      const target = event.target as Element;
      if (!this.isPasteTargetValid(target)) return;

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
    return !!pasteArea;
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