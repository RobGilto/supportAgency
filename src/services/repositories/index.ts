// Export all repositories for easy importing
export { BaseRepository } from './base';
export { CaseRepository, caseRepository } from './CaseRepository';
export { ContentPatternRepository, contentPatternRepository } from './ContentPatternRepository';
export { SavedSearchRepository, savedSearchRepository } from './SavedSearchRepository';

// Export commonly used types
export type {
  Result,
  DatabaseError,
  ValidationError,
  NotFoundError
} from '@/types';