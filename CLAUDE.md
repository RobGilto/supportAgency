# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite at http://localhost:5173)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint with TypeScript support
- `npm run preview` - Preview production build locally

### Docker Development
- `npm run docker:dev` - Run development environment in Docker
- `npm run docker:prod` - Run production build in Docker
- `npm run docker:build` - Build Docker images

### Testing
- No automated test framework configured - uses manual testing and AI-assisted verification

## Project Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.1.0 with path aliases (`@/` maps to `./src/`)
- **Styling**: Tailwind CSS 3.3.5 with Headless UI components
- **State Management**: Zustand 4.4.7 for global state
- **Database**: Local-first using Dexie.js (IndexedDB wrapper)
- **Additional**: xterm.js for terminal components, Chart.js for analytics

### Application Type
Local-first browser application - no backend required. All data stored in IndexedDB with browser APIs for file operations.

### Code Organization
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks  
├── pages/         # Page-level components
├── services/      # Business logic and data access (Repository pattern)
├── stores/        # Zustand state management stores
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── styles/        # CSS and styling files
```

### Key Architectural Patterns
- **Repository Pattern**: Abstract data access through service layer
- **Local-First Design**: Optimize for performance with IndexedDB storage
- **Component-Based**: React components with TypeScript strict mode
- **Result<T, E> Error Handling**: Structured error handling pattern
- **File Size Limit**: All files must be under 500 lines

### Development Guidelines
- TypeScript strict mode enabled with path mapping (`@/*` → `./src/*`)
- ESLint and Prettier configured for code quality
- No unused locals/parameters allowed
- All imports should use absolute paths with `@/` alias when referencing src/

### Project Context
Smart Support Agent Application - intelligent support case management system with:
- Content processing and categorization
- Image annotation capabilities
- CLI terminal integration
- Pattern matching for similar cases
- LLM integration safeguards for report generation

The application is currently in early development with basic React scaffolding in place.