# Tech Stack

## Architecture Overview
This project follows a monorepo structure with separated frontend, backend, and shared packages to maintain clean boundaries while enabling code reuse.

## Frontend Stack

### Core Framework
- **React 18+** with TypeScript
- **Vite** for build tooling and development server
- **React Router v6** for client-side routing

### State Management
- **Zustand** or **Redux Toolkit** for global state
- **React Query (TanStack Query)** for server state management
- **React Hook Form** for form state management

### UI & Styling
- **Tailwind CSS** for utility-first styling
- **Headless UI** or **Radix UI** for accessible components
- **Lucide React** for iconography
- **Framer Motion** for animations (optional)

### Development Tools
- **TypeScript** for type safety
- **ESLint** with React and TypeScript rules
- **Prettier** for code formatting
- **Vitest** for unit testing
- **Testing Library** for component testing

## Backend Stack

### Core Framework
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **tsx** for TypeScript execution in development

### Database & ORM
- **PostgreSQL** for primary database
- **Prisma** as ORM and database toolkit
- **Redis** for caching and session storage

### Authentication & Security
- **Passport.js** with JWT strategy
- **bcrypt** for password hashing
- **helmet** for security headers
- **cors** for CORS configuration
- **rate-limiter-flexible** for rate limiting

### Validation & Documentation
- **Zod** for runtime validation and schema definition
- **Swagger/OpenAPI** for API documentation
- **express-validation** middleware

### Development Tools
- **nodemon** for development auto-restart
- **Jest** for unit and integration testing
- **Supertest** for API testing
- **ESLint** with Node.js rules
- **Prettier** for code formatting

## Shared Package

### Validation & Types
- **Zod** for schema validation
- **TypeScript** for shared type definitions

### Utilities
- **date-fns** for date manipulation
- **lodash** for utility functions (selective imports)
- **crypto** (Node.js built-in) for cryptographic functions

## Database

### Primary Database
- **PostgreSQL 15+**
- **Connection pooling** with pg-pool
- **Migrations** managed by Prisma

### Caching
- **Redis 7+** for:
  - Session storage
  - API response caching
  - Rate limiting data
  - Real-time features (if needed)

## Development Environment

### Package Management
- **npm** with workspaces for monorepo management
- **Separate package.json** for each package (frontend, backend, shared)

### Code Quality
- **Husky** for git hooks
- **lint-staged** for pre-commit linting
- **Conventional Commits** for commit message format
- **Commitizen** for commit message assistance

### Testing Strategy
- **Unit Tests**: Jest (backend), Vitest (frontend)
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright or Cypress (optional)
- **Code Coverage**: Built-in coverage tools

### Build & Deployment
- **Docker** for containerization
- **Docker Compose** for local development
- **GitHub Actions** for CI/CD pipeline
- **Environment-specific configurations**

## Development Dependencies

### Root Level (Workspace)
```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "@tanstack/react-query": "^4.0.0",
    "zustand": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.0.0",
    "vitest": "^0.34.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.0",
    "zod": "^3.0.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/express": "^4.17.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "tsx": "^3.12.0"
  }
}
```

### Shared Dependencies
```json
{
  "dependencies": {
    "zod": "^3.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

## Environment Configuration

### Development Environment Variables

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ENV=development
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/supportagency_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Production Considerations
- Use environment-specific configuration files
- Implement proper secrets management
- Configure SSL/TLS certificates
- Set up monitoring and logging
- Implement health checks
- Configure auto-scaling (if using cloud platforms)

## IDE Configuration

### VS Code Extensions
- **TypeScript and JavaScript Language Features**
- **ESLint**
- **Prettier**
- **Tailwind CSS IntelliSense**
- **Prisma**
- **Thunder Client** (for API testing)

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Performance Considerations

### Frontend Optimization
- **Code splitting** with React.lazy and Suspense
- **Tree shaking** for unused code elimination
- **Bundle analysis** with webpack-bundle-analyzer
- **Image optimization** with modern formats (WebP, AVIF)
- **Service worker** for caching (optional)

### Backend Optimization
- **Database indexing** for frequently queried fields
- **Connection pooling** for database connections
- **Response compression** with gzip
- **Caching strategies** with Redis
- **Rate limiting** to prevent abuse

## Security Best Practices

### General Security
- **HTTPS only** in production
- **Security headers** with Helmet.js
- **Input validation** with Zod schemas
- **SQL injection prevention** with parameterized queries
- **XSS protection** with proper sanitization

### Authentication Security
- **JWT tokens** with secure expiration
- **Password hashing** with bcrypt
- **Rate limiting** on auth endpoints
- **Secure cookie settings** for sessions
- **CORS configuration** for API access

This tech stack provides a modern, scalable foundation for building web applications with clear separation of concerns and strong type safety throughout the entire application.