import { Table } from 'dexie';
import { Result, DatabaseError, ValidationError, NotFoundError } from '@/types';

/**
 * Base repository class implementing common CRUD operations
 * All repositories extend this class to ensure consistent error handling
 */
export abstract class BaseRepository<T, TKey = string> {
  protected table: Table<T, TKey>;

  constructor(table: Table<T, TKey>) {
    this.table = table;
  }

  /**
   * Create a new entity
   */
  async create(entity: T): Promise<Result<T, DatabaseError | ValidationError>> {
    try {
      await this.validateEntity(entity);
      const key = await this.table.add(entity);
      const created = await this.table.get(key);
      
      if (!created) {
        return {
          success: false,
          error: new DatabaseError('Failed to retrieve created entity')
        };
      }

      return {
        success: true,
        data: created
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error
        };
      }
      
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create entity: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: TKey): Promise<Result<T, DatabaseError | NotFoundError>> {
    try {
      const entity = await this.table.get(id);
      
      if (!entity) {
        return {
          success: false,
          error: new NotFoundError(`Entity with ID ${id} not found`, this.table.name, String(id))
        };
      }

      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to find entity by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<Result<T[], DatabaseError>> {
    try {
      const entities = await this.table.toArray();
      
      return {
        success: true,
        data: entities
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to find all entities: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: TKey, updates: Partial<T>): Promise<Result<T, DatabaseError | ValidationError | NotFoundError>> {
    try {
      // Check if entity exists
      const existingResult = await this.findById(id);
      if (!existingResult.success) {
        return existingResult;
      }

      // Validate updates
      await this.validateUpdates(updates, existingResult.data);

      // Perform update
      await this.table.update(id, updates);
      
      // Return updated entity
      const updatedResult = await this.findById(id);
      if (!updatedResult.success) {
        return {
          success: false,
          error: new DatabaseError('Failed to retrieve updated entity')
        };
      }

      return updatedResult;
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error
        };
      }
      
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update entity: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: TKey): Promise<Result<void, DatabaseError | NotFoundError>> {
    try {
      // Check if entity exists
      const existingResult = await this.findById(id);
      if (!existingResult.success) {
        return {
          success: false,
          error: existingResult.error
        };
      }

      await this.table.delete(id);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete entity: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Count total entities
   */
  async count(): Promise<Result<number, DatabaseError>> {
    try {
      const count = await this.table.count();
      
      return {
        success: true,
        data: count
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to count entities: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: TKey): Promise<Result<boolean, DatabaseError>> {
    try {
      const entity = await this.table.get(id);
      
      return {
        success: true,
        data: !!entity
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to check entity existence: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(entities: T[]): Promise<Result<T[], DatabaseError | ValidationError>> {
    try {
      // Validate all entities
      for (const entity of entities) {
        await this.validateEntity(entity);
      }

      await this.table.bulkAdd(entities);
      
      return {
        success: true,
        data: entities
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error
        };
      }
      
      return {
        success: false,
        error: new DatabaseError(
          `Failed to bulk create entities: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(ids: TKey[]): Promise<Result<void, DatabaseError>> {
    try {
      await this.table.bulkDelete(ids);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to bulk delete entities: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }

  /**
   * Abstract method for entity validation
   * Must be implemented by each repository
   */
  protected abstract validateEntity(entity: T): Promise<void>;

  /**
   * Abstract method for update validation
   * Can be overridden by repositories that need custom update validation
   */
  protected async validateUpdates(updates: Partial<T>, existing: T): Promise<void> {
    // Default implementation: merge and validate
    const merged = { ...existing, ...updates };
    await this.validateEntity(merged);
  }

  /**
   * Helper method to wrap database operations with proper error handling
   */
  protected async safeOperation<R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<Result<R, DatabaseError>> {
    try {
      const result = await operation();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      };
    }
  }
}