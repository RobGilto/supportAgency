# Error Handling Strategy

Since this is a local-first browser application, the error handling strategy focuses on client-side error management, user experience, and data integrity.

## General Approach
- **Error Model:** Functional error handling with Result/Either pattern for critical operations
- **Exception Hierarchy:** Custom error classes extending base ApplicationError
- **Error Propagation:** Bubble up with context, graceful degradation for non-critical features

## Logging Standards
- **Library:** Custom logging service with IndexedDB persistence
- **Format:** Structured JSON logs with context
- **Levels:** ERROR, WARN, INFO, DEBUG
- **Required Context:**
  - Correlation ID: UUID for tracking related operations
  - Service Context: Component/service name where error occurred
  - User Context: Anonymized user actions and session info

## Error Handling Patterns

### External API Errors
- **Retry Policy:** Exponential backoff for network requests (max 3 retries)
- **Circuit Breaker:** Disable failing external services temporarily
- **Timeout Configuration:** 10s for API calls, 30s for file operations
- **Error Translation:** Convert API errors to user-friendly messages

### Business Logic Errors
- **Custom Exceptions:** CaseValidationError, HivemindGenerationError, ImageProcessingError
- **User-Facing Errors:** Toast notifications with actionable messages
- **Error Codes:** Structured error codes (e.g., CASE_001, HIVE_002, IMG_003)

### Data Consistency
- **Transaction Strategy:** IndexedDB transactions for multi-table operations
- **Compensation Logic:** Rollback patterns for failed operations
- **Idempotency:** Safe retry mechanisms for critical operations

## Detailed Error Handling Implementation

### Custom Error Classes
```typescript
// Base application error
abstract class ApplicationError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly timestamp: Date;
  readonly context: Record<string, any>;
  
  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
  }
}

// Specific error types
class DatabaseError extends ApplicationError {
  readonly code = 'DB_ERROR';
  readonly severity = 'high' as const;
}

class ValidationError extends ApplicationError {
  readonly code = 'VALIDATION_ERROR';
  readonly severity = 'medium' as const;
}

class NetworkError extends ApplicationError {
  readonly code = 'NETWORK_ERROR';
  readonly severity = 'medium' as const;
}

class ImageProcessingError extends ApplicationError {
  readonly code = 'IMAGE_PROCESSING_ERROR';
  readonly severity = 'low' as const;
}
```

### Error Logging Service
```typescript
interface LogEntry {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  error?: ApplicationError;
  context: Record<string, any>;
  timestamp: Date;
  correlationId: string;
  component: string;
}

class LoggingService {
  private db: LogDatabase;
  
  async logError(error: ApplicationError, component: string, correlationId: string) {
    const entry: LogEntry = {
      id: generateUUID(),
      level: 'ERROR',
      message: error.message,
      error: error,
      context: error.context,
      timestamp: new Date(),
      correlationId,
      component
    };
    
    await this.db.logs.add(entry);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${component}] ${error.message}`, error);
    }
  }
}
```

### Result Pattern for Critical Operations
```typescript
type Result<T, E = ApplicationError> = 
  | { success: true; data: T }
  | { success: false; error: E };

class CaseService {
  async createCase(data: CaseInput): Promise<Result<Case, ValidationError>> {
    try {
      // Validation
      const validation = this.validateCaseData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: new ValidationError('Invalid case data', validation.errors)
        };
      }
      
      // Create case
      const case = await this.repository.create(data);
      return { success: true, data: case };
      
    } catch (error) {
      this.logger.logError(error, 'CaseService', data.correlationId);
      return {
        success: false,
        error: error instanceof ApplicationError ? error : new DatabaseError('Unknown error')
      };
    }
  }
}
```

## Browser-Specific Error Handling

### IndexedDB Error Handling
```typescript
class DatabaseRepository {
  async withTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    operation: (tx: Transaction) => Promise<T>
  ): Promise<Result<T, DatabaseError>> {
    try {
      const tx = this.db.transaction(stores, mode);
      
      const result = await operation(tx);
      
      // Wait for transaction to complete
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      
      return { success: true, data: result };
      
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Transaction failed: ${error.message}`, { error })
      };
    }
  }
}
```

### Image Processing Error Handling
```typescript
class ImageProcessor {
  async convertToWebP(file: File): Promise<Result<Blob, ImageProcessingError>> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: new ImageProcessingError('Invalid file type', { fileType: file.type })
        };
      }
      
      // Size limit check
      if (file.size > 10 * 1024 * 1024) { // 10MB
        return {
          success: false,
          error: new ImageProcessingError('File too large', { size: file.size })
        };
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return {
          success: false,
          error: new ImageProcessingError('Canvas not supported')
        };
      }
      
      // Process image...
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert to WebP'));
        }, 'image/webp', 0.8);
      });
      
      return { success: true, data: webpBlob };
      
    } catch (error) {
      return {
        success: false,
        error: new ImageProcessingError(`Image processing failed: ${error.message}`)
      };
    }
  }
}
```

## User Experience Error Handling

### Toast Notification System
```typescript
interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actions?: NotificationAction[];
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
}

class NotificationService {
  showError(error: ApplicationError, actions?: NotificationAction[]) {
    const notification: ErrorNotification = {
      id: generateUUID(),
      type: 'error',
      title: this.getErrorTitle(error),
      message: this.getUserFriendlyMessage(error),
      actions: actions || this.getDefaultActions(error),
      dismissible: true,
      autoHide: error.severity === 'low',
      duration: error.severity === 'low' ? 5000 : undefined
    };
    
    this.notificationStore.add(notification);
  }
  
  private getUserFriendlyMessage(error: ApplicationError): string {
    const messages: Record<string, string> = {
      'DB_ERROR': 'There was a problem saving your data. Please try again.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NETWORK_ERROR': 'Network connection issue. Please check your internet connection.',
      'IMAGE_PROCESSING_ERROR': 'Unable to process the image. Please try a different file.'
    };
    
    return messages[error.code] || 'An unexpected error occurred. Please try again.';
  }
}
```

### Graceful Degradation
```typescript
class FeatureToggleService {
  private failedFeatures = new Set<string>();
  
  async executeWithFallback<T>(
    featureName: string,
    primaryOperation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    // If feature is known to be failing, use fallback immediately
    if (this.failedFeatures.has(featureName) && fallbackOperation) {
      return fallbackOperation();
    }
    
    try {
      const result = await primaryOperation();
      // Reset failure state on success
      this.failedFeatures.delete(featureName);
      return result;
      
    } catch (error) {
      this.failedFeatures.add(featureName);
      this.logger.logError(error, 'FeatureToggle', featureName);
      
      if (fallbackOperation) {
        this.notificationService.showWarning(
          `${featureName} is temporarily unavailable. Using alternative method.`
        );
        return fallbackOperation();
      }
      
      throw error;
    }
  }
}
```