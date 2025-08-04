# Smart Support Agent Application

A local-first React + TypeScript application for intelligent support case management.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or using Docker
npm run docker:dev
```

### Production
```bash
# Build and run production
npm run docker:prod
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # Business logic and data access
├── stores/        # Zustand state management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── styles/        # CSS and styling
```

## Technology Stack

- **Frontend**: React 18.2.0, TypeScript 5.3.3
- **Build Tool**: Vite 5.1.0
- **Styling**: Tailwind CSS 3.3.5
- **State Management**: Zustand 4.4.7
- **Database**: IndexedDB via Dexie.js 3.2.4
- **UI Components**: Headless UI 1.7.17
- **Deployment**: Docker containerization

## Development Guidelines

- All files must be under 500 lines
- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Repository pattern for data access
- Result<T, E> error handling

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run docker:dev` - Run development in Docker
- `npm run docker:prod` - Run production in Docker