# Coding Standards

## General Principles

### Code Quality
- Write self-documenting code with clear, descriptive names
- Keep functions small and focused (single responsibility principle)
- Favor composition over inheritance
- Use consistent indentation (2 spaces for web technologies, 4 for Python)
- Maximum line length: 100 characters

### Documentation
- Document complex business logic and algorithms
- Use JSDoc/TSDoc for function signatures
- Keep README files up to date
- Document API endpoints and data models

## Language-Specific Standards

### JavaScript/TypeScript
```javascript
// Use const by default, let when reassignment needed
const apiUrl = 'https://api.example.com';
let counter = 0;

// Function naming: camelCase, descriptive verbs
function calculateTotalPrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Use arrow functions for callbacks and short functions
const filtered = items.filter(item => item.active);

// Destructuring for cleaner code
const { name, email } = user;
const [first, ...rest] = items;
```

#### TypeScript Specific
- Always use explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Enable strict mode in tsconfig.json
- Use optional chaining and nullish coalescing

```typescript
interface User {
  id: string;
  name: string;
  email?: string;
}

function processUser(user: User): Promise<ProcessedUser> {
  return processUserData(user);
}
```

### Python
```python
# Use snake_case for variables and functions
def calculate_total_price(items):
    return sum(item.price for item in items)

# Use PascalCase for classes
class UserService:
    def __init__(self, database_url: str):
        self.database_url = database_url

# Type hints for function signatures
def get_user_by_id(user_id: int) -> Optional[User]:
    return database.query(User).filter(User.id == user_id).first()
```

### CSS/SCSS
```css
/* Use BEM methodology for class naming */
.card {
  padding: 1rem;
}

.card__header {
  font-weight: bold;
}

.card__header--large {
  font-size: 1.5rem;
}

/* Use semantic color names */
:root {
  --color-primary: #007bff;
  --color-danger: #dc3545;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
}
```

## File Organization

### Monorepo Structure
This project uses a separated structure with three main packages:

```
supportAgency/
├── src/                 # All source code
│   ├── frontend/        # Client-side application
│   │   ├── src/
│   │   │   ├── components/ # UI components
│   │   │   ├── pages/   # Page components
│   │   │   ├── services/ # API client services
│   │   │   ├── hooks/   # Custom React hooks
│   │   │   ├── stores/  # State management
│   │   │   └── utils/   # Frontend utilities
│   │   └── tests/       # Frontend tests
│   ├── backend/         # Server-side application
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── services/ # Business logic
│   │   │   ├── models/  # Data models
│   │   │   ├── routes/  # API routes
│   │   │   └── middleware/ # Express middleware
│   │   └── tests/       # Backend tests
│   └── shared/          # Code shared between frontend/backend
│       ├── types/       # Shared TypeScript types
│       ├── utils/       # Shared utilities
│       ├── constants/   # Shared constants
│       └── schemas/     # Validation schemas
```

### File Naming Conventions

#### Frontend
- **Components**: PascalCase (`UserProfile.tsx`, `LoginForm.tsx`)
- **Pages**: PascalCase (`Dashboard.tsx`, `SettingsPage.tsx`)
- **Services**: camelCase (`userService.ts`, `authApi.ts`)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Types**: camelCase with `.types.ts` suffix

#### Backend
- **Controllers**: camelCase (`userController.ts`, `authController.ts`)
- **Services**: camelCase (`emailService.ts`, `databaseService.ts`)
- **Models**: PascalCase (`User.ts`, `Product.ts`)
- **Routes**: camelCase (`userRoutes.ts`, `authRoutes.ts`)

#### Shared
- **Types**: camelCase with `.types.ts` suffix
- **Utilities**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE for values, camelCase for files
- **Schemas**: camelCase with `.schema.ts` suffix

### Import Path Configuration
Configure absolute imports in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@frontend/*": ["src/frontend/src/*"],
      "@backend/*": ["src/backend/src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

## Error Handling

### Frontend
```javascript
// Use try-catch for async operations
async function fetchUser(id) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    throw new UserFetchError(`Unable to fetch user ${id}`);
  }
}

// Custom error classes
class UserFetchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserFetchError';
  }
}
```

### Backend
```python
# Use specific exception classes
class UserNotFoundError(Exception):
    """Raised when a user cannot be found"""
    pass

def get_user(user_id: int) -> User:
    try:
        return database.get_user(user_id)
    except DatabaseError as e:
        logger.error(f"Database error fetching user {user_id}: {e}")
        raise UserNotFoundError(f"User {user_id} not found") from e
```

## Testing Standards

### Unit Tests
- Test file naming: `component.test.ts` or `test_service.py`
- One test file per source file
- Use descriptive test names: `should_return_error_when_user_not_found`
- Follow AAA pattern: Arrange, Act, Assert

```javascript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid ID provided', async () => {
      // Arrange
      const userId = 123;
      const expectedUser = { id: 123, name: 'John' };
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toEqual(expectedUser);
    });
  });
});
```

### Integration Tests
- Test API endpoints end-to-end
- Use test databases/environments
- Clean up test data after each test

## Security Standards

### Input Validation
```javascript
// Validate all user inputs
function createUser(userData) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(18).max(120)
  });
  
  const { error, value } = schema.validate(userData);
  if (error) throw new ValidationError(error.details[0].message);
  
  return value;
}
```

### SQL Injection Prevention
```python
# Use parameterized queries
def get_user_by_email(email: str) -> Optional[User]:
    query = "SELECT * FROM users WHERE email = %s"
    return database.execute(query, (email,))
```

### Environment Variables
- Never commit secrets to version control
- Use environment variables for sensitive data
- Validate required environment variables on startup

```javascript
const config = {
  databaseUrl: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is required');
  })(),
  apiKey: process.env.API_KEY || (() => {
    throw new Error('API_KEY environment variable is required');
  })()
};
```

## Performance Guidelines

### Frontend
- Use lazy loading for components and routes
- Implement proper memoization with React.memo, useMemo, useCallback
- Optimize bundle size with code splitting
- Use Web Vitals metrics for monitoring

### Backend
- Implement database query optimization
- Use caching strategies (Redis, in-memory)
- Implement proper indexing
- Monitor and log performance metrics

## Git Standards

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): add JWT token validation
fix(api): resolve user creation endpoint error
docs(readme): update installation instructions
```

### Branch Naming
- Feature branches: `feature/add-user-authentication`
- Bug fixes: `fix/resolve-login-error`
- Hotfixes: `hotfix/critical-security-patch`

### Pull Request Guidelines
- Use descriptive titles and descriptions
- Include testing instructions
- Link related issues
- Require code review before merging
- Ensure CI/CD passes before merge

## Code Review Checklist

### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

### Code Quality
- [ ] Follows coding standards
- [ ] No code duplication
- [ ] Functions are appropriately sized
- [ ] Variable and function names are descriptive

### Security
- [ ] Input validation implemented
- [ ] No hardcoded secrets
- [ ] Authentication/authorization properly implemented
- [ ] SQL injection prevention measures

### Testing
- [ ] Unit tests included and passing
- [ ] Integration tests where appropriate
- [ ] Test coverage is adequate
- [ ] Tests are maintainable

## Tools and Linting

### Required Tools
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Husky for git hooks
- Jest for testing
- SonarQube for code quality analysis

### Configuration Files
Ensure these files are present and properly configured:
- `.eslintrc.js`
- `.prettierrc`
- `jest.config.js`
- `tsconfig.json` (for TypeScript projects)
- `.gitignore`

## Maintenance

### Regular Reviews
- Review and update coding standards quarterly
- Incorporate team feedback and industry best practices
- Update tooling and dependencies regularly
- Monitor code quality metrics and adjust standards as needed

### Documentation Updates
- Keep this document synchronized with actual practices
- Update examples to reflect current codebase patterns
- Document any project-specific deviations from these standards