# Coding Standards

These standards are **MANDATORY** for AI agents and directly control code generation behavior. They build upon the existing project standards while adapting for the local-first browser architecture.

## Core Standards
- **Languages & Runtimes:** TypeScript 5.3.3, Browser JavaScript ES2022+
- **Style & Linting:** ESLint with TypeScript rules, Prettier for formatting
- **Test Organization:** Manual test scenarios in `/tests/` directory, documented in Markdown
- **File Size Limit:** **Maximum 500 lines per file** - Files exceeding this must be split into smaller, focused modules

## Critical Rules

- **Database Operations:** Always use Repository pattern - never direct Dexie calls in components
- **Error Handling:** Use Result<T, E> pattern for all operations that can fail
- **Image Storage:** Convert all images to WebP format before storing in IndexedDB
- **Type Safety:** No `any` types - use proper TypeScript interfaces for all data
- **Local Storage:** Use IndexedDB via Dexie for structured data, LocalStorage only for simple settings
- **Component State:** Use Zustand stores for shared state, React state for component-local only
- **File Organization:** One component per file, export from index.ts files
- **Console Logging:** Never use console.log in production - use LoggingService instead
- **Case Number Format:** Use 8-digit format (e.g., "05907169") for all case numbers
- **JIRA Ticket Validation:** Use "DOMO-456837" and "HIVE-2263" format validation
- **WebP Conversion:** All image uploads must be converted to WebP with quality 0.8
- **UUID Generation:** Use crypto.randomUUID() for all ID generation
- **File Size Limit:** **No file shall exceed 500 lines** - split into focused modules instead

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `CaseManager.tsx`, `ImageGallery.tsx` |
| Services | camelCase with Service suffix | `caseService.ts`, `hivemindService.ts` |
| Hooks | camelCase with "use" prefix | `useDatabase.ts`, `useImageProcessing.ts` |
| Types/Interfaces | PascalCase | `Case`, `HivemindReport`, `DatabaseSchema` |
| Utilities | camelCase | `formatDate.ts`, `validateEmail.ts` |
| Constants | SCREAMING_SNAKE_CASE for values | `MAX_FILE_SIZE`, `DEFAULT_PRIORITY` |
| Database Tables | camelCase | `cases`, `hivemindReports`, `imageGallery` |

## Language-Specific Guidelines

### TypeScript Specifics
- **Strict Mode:** Enable all strict TypeScript compiler options
- **Explicit Types:** Always use explicit types for function parameters and return values
- **Interface Usage:** Use interfaces for object shapes, types for unions/primitives
- **Optional Chaining:** Use optional chaining (?.) and nullish coalescing (??) operators
- **Type Guards:** Create type guard functions for runtime type checking
- **Generic Constraints:** Always constrain generics with extends when possible

```typescript
// Good: Explicit types and proper interfaces
interface User {
  id: string;
  name: string;
  email?: string;
}

function processUser(user: User): Promise<ProcessedUser> {
  return processUserData(user);
}

// Good: Result pattern for error handling
async function createCase(data: CaseInput): Promise<Result<Case, ValidationError>> {
  try {
    const validation = await validateCaseData(data);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }
    
    const case = await caseRepository.create(data);
    return { success: true, data: case };
  } catch (error) {
    return { 
      success: false, 
      error: new DatabaseError('Failed to create case') 
    };
  }
}
```

### React Specifics
- **Hook Dependencies:** Always include all dependencies in useEffect/useCallback dependency arrays
- **Component Props:** Use interfaces for component props, never inline types
- **State Updates:** Use functional state updates when depending on previous state
- **Event Handlers:** Use useCallback for event handlers passed to child components
- **Memoization:** Use React.memo, useMemo, and useCallback judiciously - not by default

```typescript
// Good: Proper React component structure
interface CaseFormProps {
  initialData?: Partial<Case>;
  onSubmit: (case: Case) => void;
  onCancel: () => void;
}

const CaseForm: React.FC<CaseFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<CaseInput>(() => 
    initialData || getDefaultCaseData()
  );

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    // Handle submission
  }, [formData, onSubmit]);

  useEffect(() => {
    // Cleanup function for any subscriptions
    return () => {
      // Cleanup logic
    };
  }, []);

  return (
    // Component JSX
  );
};
```

### IndexedDB/Dexie Specifics
- **Schema Versioning:** Always increment version number when changing schema
- **Index Strategy:** Create indexes for all frequently queried fields
- **Bulk Operations:** Use bulkAdd/bulkPut for multiple record operations
- **Transaction Scope:** Keep transactions as narrow as possible in scope
- **Error Recovery:** Implement retry logic for failed database operations

```typescript
// Good: Repository pattern with proper error handling
class CaseRepository {
  constructor(private db: Database) {}

  async create(data: CaseInput): Promise<Result<Case, DatabaseError>> {
    try {
      const case: Case = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.transaction('rw', this.db.cases, async () => {
        await this.db.cases.add(case);
      });

      return { success: true, data: case };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(`Failed to create case: ${error.message}`)
      };
    }
  }
}
```

## File Organization Standards

Based on existing standards but adapted for local-first architecture:

```
src/
├── components/           # React components (PascalCase files)
│   ├── common/          # Shared UI components
│   ├── cases/           # Case-specific components  
│   └── index.ts         # Barrel exports
├── services/            # Business logic (camelCase files)
│   ├── database/        # IndexedDB repositories
│   ├── content-processing/
│   └── index.ts
├── hooks/               # Custom React hooks (camelCase with use prefix)
├── stores/              # Zustand stores (camelCase files)
├── types/               # TypeScript definitions (camelCase files)
├── utils/               # Utility functions (camelCase files)
└── constants/           # Application constants (camelCase files)
```

## Import Organization
```typescript
// 1. External library imports
import React, { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';

// 2. Internal service imports
import { caseService } from '@/services/caseService';
import { useDatabase } from '@/hooks/useDatabase';

// 3. Type imports
import type { Case, CaseInput } from '@/types/case';

// 4. Component imports
import { Button } from '@/components/common/Button';
```

## Security Standards for Browser Application

```typescript
// Input validation for all user data
function validateCaseInput(data: unknown): Result<CaseInput, ValidationError> {
  const schema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(10).max(5000),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
  });

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    return { 
      success: false, 
      error: new ValidationError('Invalid case data', { zodError: error })
    };
  }
}

// Secure clipboard operations
async function copyToClipboard(text: string): Promise<Result<void, ClipboardError>> {
  if (!navigator.clipboard) {
    return {
      success: false,
      error: new ClipboardError('Clipboard API not available')
    };
  }

  try {
    await navigator.clipboard.writeText(text);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: new ClipboardError(`Failed to copy: ${error.message}`)
    };
  }
}
```

## Performance Guidelines

```typescript
// Lazy loading for large components
const ImageGallery = lazy(() => import('@/components/image-gallery/ImageGallery'));

// Proper memoization
const MemoizedCaseList = React.memo(CaseList, (prevProps, nextProps) => {
  return prevProps.cases.length === nextProps.cases.length &&
         prevProps.filter === nextProps.filter;
});

// Efficient IndexedDB queries
const casesByStatus = useMemo(async () => {
  return await db.cases
    .where('status')
    .equals(selectedStatus)
    .limit(50)
    .toArray();
}, [selectedStatus]);
```

## Key Adaptations from Existing Standards:
- **Removed backend/server patterns** (controllers, routes, SQL) - not applicable
- **Added IndexedDB/Dexie patterns** specific to browser database
- **Enhanced React patterns** for complex state management
- **Added WebP/Canvas patterns** for image processing
- **Maintained 500-line file limit** from existing standards
- **Kept TypeScript strict mode** and type safety requirements
- **Preserved error handling patterns** but adapted for browser context