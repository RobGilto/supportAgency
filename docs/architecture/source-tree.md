# Source Tree Structure

## Overview
This project uses a monorepo structure with clear separation between frontend, backend, and shared code to maintain clean boundaries and enable independent development while sharing common utilities. All source code is organized under a single `src` directory.

## Directory Structure

```
supportAgency/
├── src/                     # All source code
│   ├── frontend/            # Client-side application
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   │   ├── common/  # Generic components (Button, Modal, etc.)
│   │   │   │   ├── forms/   # Form-specific components
│   │   │   │   └── layout/  # Layout components (Header, Sidebar, etc.)
│   │   │   ├── pages/       # Page-level components
│   │   │   │   ├── auth/    # Authentication pages
│   │   │   │   ├── dashboard/ # Dashboard pages
│   │   │   │   └── settings/  # Settings pages
│   │   │   ├── services/    # API client services
│   │   │   │   ├── api/     # API call functions
│   │   │   │   ├── auth/    # Authentication services
│   │   │   │   └── storage/ # Local storage utilities
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── stores/      # State management (Redux/Zustand)
│   │   │   ├── styles/      # Global styles and themes
│   │   │   │   ├── components/ # Component-specific styles
│   │   │   │   ├── globals.css # Global CSS
│   │   │   │   └── variables.css # CSS custom properties
│   │   │   ├── utils/       # Frontend-specific utilities
│   │   │   ├── assets/      # Static assets (images, icons)
│   │   │   ├── types/       # Frontend-specific TypeScript types
│   │   │   └── index.tsx    # Application entry point
│   │   ├── public/          # Static files served by web server
│   │   │   ├── index.html   # HTML template
│   │   │   ├── favicon.ico  # Favicon
│   │   │   └── manifest.json # PWA manifest
│   │   ├── tests/           # Frontend tests
│   │   │   ├── components/  # Component tests
│   │   │   ├── pages/       # Page tests
│   │   │   ├── services/    # Service tests
│   │   │   └── utils/       # Utility tests
│   │   ├── package.json     # Frontend dependencies
│   │   ├── tsconfig.json    # TypeScript config for frontend
│   │   ├── vite.config.ts   # Build configuration
│   │   └── .env.example     # Environment variables template
│   │
│   ├── backend/             # Server-side application
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   │   ├── auth/    # Authentication controllers
│   │   │   │   ├── users/   # User management controllers
│   │   │   │   └── api/     # API route controllers
│   │   │   ├── services/    # Business logic layer
│   │   │   │   ├── auth/    # Authentication services
│   │   │   │   ├── database/ # Database services
│   │   │   │   ├── email/   # Email services
│   │   │   │   └── validation/ # Input validation services
│   │   │   ├── models/      # Data models
│   │   │   │   ├── entities/ # Database entities
│   │   │   │   └── dto/     # Data transfer objects
│   │   │   ├── middleware/  # Express middleware
│   │   │   │   ├── auth.ts  # Authentication middleware
│   │   │   │   ├── validation.ts # Validation middleware
│   │   │   │   ├── error.ts # Error handling middleware
│   │   │   │   └── logging.ts # Request logging middleware
│   │   │   ├── routes/      # API route definitions
│   │   │   │   ├── auth.ts  # Authentication routes
│   │   │   │   ├── users.ts # User routes
│   │   │   │   └── api.ts   # Main API routes
│   │   │   ├── database/    # Database configuration
│   │   │   │   ├── migrations/ # Database migrations
│   │   │   │   ├── seeds/   # Database seed data
│   │   │   │   └── config.ts # Database connection config
│   │   │   ├── utils/       # Backend-specific utilities
│   │   │   ├── types/       # Backend-specific TypeScript types
│   │   │   ├── config/      # Application configuration
│   │   │   │   ├── database.ts # Database configuration
│   │   │   │   ├── auth.ts  # Authentication configuration
│   │   │   │   └── app.ts   # Application configuration
│   │   │   └── server.ts    # Application entry point
│   │   ├── tests/           # Backend tests
│   │   │   ├── controllers/ # Controller tests
│   │   │   ├── services/    # Service tests
│   │   │   ├── models/      # Model tests
│   │   │   ├── routes/      # Route tests
│   │   │   ├── integration/ # Integration tests
│   │   │   └── fixtures/    # Test data fixtures
│   │   ├── package.json     # Backend dependencies
│   │   ├── tsconfig.json    # TypeScript config for backend
│   │   └── .env.example     # Environment variables template
│   │
│   └── shared/              # Code shared between frontend and backend
│       ├── types/           # Shared TypeScript types
│       │   ├── api/         # API request/response types
│       │   ├── auth/        # Authentication types
│       │   ├── user/        # User-related types
│       │   └── common/      # Common utility types
│       ├── utils/           # Shared utility functions
│       │   ├── validation/  # Input validation utilities
│       │   ├── formatting/  # Data formatting utilities
│       │   ├── crypto/      # Cryptography utilities
│       │   └── date/        # Date manipulation utilities
│       ├── constants/       # Shared constants
│       │   ├── api.ts       # API endpoints and constants
│       │   ├── auth.ts      # Authentication constants
│       │   ├── errors.ts    # Error codes and messages
│       │   └── validation.ts # Validation rules and messages
│       ├── schemas/         # Validation schemas (Zod, Joi, etc.)
│       │   ├── auth.ts      # Authentication schemas
│       │   ├── user.ts      # User schemas
│       │   └── api.ts       # API schemas
│       ├── package.json     # Shared dependencies
│       └── tsconfig.json    # TypeScript config for shared code
│
├── docs/                    # Project documentation
│   ├── architecture/        # Architecture documentation
│   │   ├── coding-standards.md
│   │   ├── source-tree.md
│   │   └── tech-stack.md
│   ├── api/                 # API documentation
│   │   ├── endpoints.md     # API endpoint documentation
│   │   └── authentication.md # Auth documentation
│   └── deployment/          # Deployment guides
│       ├── development.md   # Local development setup
│       ├── staging.md       # Staging deployment
│       └── production.md    # Production deployment
│
├── .bmad-core/              # BMad framework files
├── .github/                 # GitHub workflows and templates
│   ├── workflows/           # CI/CD workflows
│   └── PULL_REQUEST_TEMPLATE.md
├── scripts/                 # Build and deployment scripts
│   ├── build.sh             # Build script
│   ├── test.sh              # Test runner script
│   └── deploy.sh            # Deployment script
├── docker-compose.yml       # Local development environment
├── package.json             # Root package.json for workspace
├── tsconfig.json            # Root TypeScript configuration
├── .gitignore               # Git ignore rules
└── README.md                # Project overview and setup
```

## File Naming Conventions

### Frontend
- **Components**: PascalCase (`UserProfile.tsx`, `LoginForm.tsx`)
- **Pages**: PascalCase (`Dashboard.tsx`, `SettingsPage.tsx`)
- **Services**: camelCase (`userService.ts`, `authApi.ts`)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Types**: camelCase with `.types.ts` suffix (`user.types.ts`, `api.types.ts`)

### Backend
- **Controllers**: camelCase (`userController.ts`, `authController.ts`)
- **Services**: camelCase (`emailService.ts`, `databaseService.ts`)
- **Models**: PascalCase (`User.ts`, `Product.ts`)
- **Routes**: camelCase (`userRoutes.ts`, `authRoutes.ts`)
- **Middleware**: camelCase (`authMiddleware.ts`, `errorMiddleware.ts`)

### Shared
- **Types**: camelCase with `.types.ts` suffix
- **Utilities**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE for values, camelCase for files
- **Schemas**: camelCase with `.schema.ts` suffix

## Import Path Conventions

### Absolute Imports
Configure path mapping in `tsconfig.json`:

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

### Import Examples
```typescript
// Frontend imports
import { Button } from '@frontend/components/common/Button';
import { UserService } from '@frontend/services/api/userService';
import { User } from '@shared/types/user/user.types';

// Backend imports
import { UserController } from '@backend/controllers/users/userController';
import { DatabaseService } from '@backend/services/database/databaseService';
import { AUTH_CONSTANTS } from '@shared/constants/auth';

// Shared imports
import { validateEmail } from '@shared/utils/validation/emailValidator';
import { ApiResponse } from '@shared/types/api/response.types';
```

## Development Workflow

### Working with Packages
```bash
# Install dependencies for specific package
cd src/frontend && npm install
cd src/backend && npm install
cd src/shared && npm install

# Or use workspace commands from root
npm run install:frontend
npm run install:backend
npm run install:shared
```

### Building and Testing
```bash
# Build all packages
npm run build

# Build specific package
npm run build:frontend
npm run build:backend
npm run build:shared

# Run tests
npm run test
npm run test:frontend
npm run test:backend
npm run test:shared
```

## Package Dependencies

### Frontend Dependencies
- React/Vue.js/Angular for UI framework
- TypeScript for type safety
- Tailwind CSS or styled-components for styling
- React Query or SWR for data fetching
- React Router for navigation

### Backend Dependencies
- Express.js or Fastify for web framework
- TypeScript for type safety
- Database ORM (Prisma, TypeORM, Sequelize)
- Authentication library (Passport.js, Auth0)
- Validation library (Zod, Joi)

### Shared Dependencies
- TypeScript for type definitions
- Validation libraries
- Utility libraries (date-fns, lodash)
- Cryptography libraries

## Best Practices

### Code Organization
1. **Single Responsibility**: Each directory should have a clear, single purpose
2. **Dependency Direction**: Frontend and Backend can import from Shared, but Shared should never import from Frontend or Backend
3. **Feature Grouping**: Group related files by feature when appropriate
4. **Consistent Structure**: Maintain consistent directory structure across similar areas

### Cross-Package Communication
1. **API Layer**: Frontend communicates with Backend only through defined API endpoints
2. **Shared Types**: Use shared types to ensure consistency between Frontend and Backend
3. **Validation**: Use shared validation schemas to ensure data consistency
4. **Constants**: Define shared constants once in the shared package

### Testing Strategy
1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows across Frontend and Backend
4. **Shared Code Tests**: Test shared utilities and types thoroughly

This structure provides clear separation of concerns while enabling code reuse and maintaining consistency across the entire application, all organized under a single `src` directory for better project organization.