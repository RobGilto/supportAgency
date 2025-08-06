import { useEffect, useRef, useCallback, useState } from 'react';
import { PasteEvent, Result } from '@/types';
import { clipboardService, PasteEventListener } from '@/services/clipboardService';

export interface UsePasteOptions {
  enabled?: boolean;
  onPaste?: (event: PasteEvent) => void;
  onError?: (error: Error) => void;
}

export interface UsePasteReturn {
  isSupported: boolean;
  isReady: boolean;
  isListening: boolean;
  analyzePaste: () => Promise<Result<PasteEvent>>;
  writeToClipboard: (text: string) => Promise<Result<void>>;
  status: {
    supported: boolean;
    permission: boolean;
    ready: boolean;
  } | null;
  requestPermission: () => Promise<void>;
}

/**
 * React hook for clipboard paste functionality
 */
export function usePaste(options: UsePasteOptions = {}): UsePasteReturn {
  const { enabled = true, onError } = options;
  const [status, setStatus] = useState<{
    supported: boolean;
    permission: boolean;
    ready: boolean;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const listenerRef = useRef<PasteEventListener | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Create stable paste event handler
  const pasteEventHandler = useCallback<PasteEventListener>((pasteEvent: PasteEvent) => {
    const currentOptions = optionsRef.current;
    
    try {
      if (currentOptions.onPaste) {
        currentOptions.onPaste(pasteEvent);
      }
    } catch (error) {
      if (currentOptions.onError && error instanceof Error) {
        currentOptions.onError(error);
      }
    }
  }, []);

  // Initialize clipboard service and check availability
  useEffect(() => {
    const checkAvailability = async () => {
      const availability = await clipboardService.checkAvailability();
      setStatus(availability);
    };

    checkAvailability();
  }, []);

  // Manage event listener based on enabled state
  useEffect(() => {
    if (!enabled || !status?.ready) {
      // Remove listener if disabled or not ready
      if (listenerRef.current) {
        clipboardService.removeEventListener(listenerRef.current);
        listenerRef.current = null;
        setIsListening(false);
      }
      return;
    }

    // Add listener if enabled and ready
    if (!listenerRef.current) {
      listenerRef.current = pasteEventHandler;
      clipboardService.addEventListener(pasteEventHandler);
      setIsListening(true);
    }

    // Cleanup on unmount
    return () => {
      if (listenerRef.current) {
        clipboardService.removeEventListener(listenerRef.current);
        listenerRef.current = null;
        setIsListening(false);
      }
    };
  }, [enabled, status?.ready, pasteEventHandler]);

  // Manual paste analysis
  const analyzePaste = useCallback(async (): Promise<Result<PasteEvent>> => {
    return await clipboardService.analyzePaste();
  }, []);

  // Write to clipboard
  const writeToClipboard = useCallback(async (text: string): Promise<Result<void>> => {
    return await clipboardService.writeClipboard(text);
  }, []);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    const permissionResult = await clipboardService.requestPermission();
    if (permissionResult.granted) {
      const availability = await clipboardService.checkAvailability();
      setStatus(availability);
    } else if (onError && permissionResult.error) {
      onError(new Error(permissionResult.error));
    }
  }, [onError]);

  return {
    isSupported: status?.supported ?? false,
    isReady: status?.ready ?? false,
    isListening,
    analyzePaste,
    writeToClipboard,
    status,
    requestPermission
  };
}

/**
 * Hook specifically for paste areas (components that should accept paste)
 */
export function usePasteArea(options: UsePasteOptions = {}) {
  const pasteHook = usePaste(options);
  
  // Return ref to attach to paste area element
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Add paste area indicators
    element.classList.add('paste-area');
    element.setAttribute('data-paste-enabled', 'true');
    
    // Add visual feedback for paste readiness
    if (pasteHook.isReady) {
      element.classList.add('paste-ready');
    } else {
      element.classList.remove('paste-ready');
    }

    return () => {
      if (element) {
        element.classList.remove('paste-area', 'paste-ready');
        element.removeAttribute('data-paste-enabled');
      }
    };
  }, [pasteHook.isReady]);

  return {
    ...pasteHook,
    ref
  };
}