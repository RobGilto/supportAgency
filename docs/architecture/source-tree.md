# Source Tree

Based on the local-first browser application architecture with React, TypeScript, and IndexedDB, here's the project folder structure:

```
smart-support-agent/
├── public/
│   ├── index.html                    # Main HTML file
│   ├── manifest.json                 # PWA manifest
│   ├── icons/                        # App icons for PWA
│   └── sw.js                         # Service worker for offline support
├── src/
│   ├── components/                   # React components
│   │   ├── common/                   # Shared UI components
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── LoadingSpinner/
│   │   │   └── index.ts
│   │   ├── layout/                   # Layout components
│   │   │   ├── AppShell/
│   │   │   ├── Navigation/
│   │   │   ├── Sidebar/
│   │   │   └── index.ts
│   │   ├── inbox/                    # Inbox management
│   │   │   ├── InboxList/
│   │   │   ├── InboxItem/
│   │   │   ├── InboxProcessor/
│   │   │   └── index.ts
│   │   ├── cases/                    # Case management
│   │   │   ├── CaseList/
│   │   │   ├── CaseDetail/
│   │   │   ├── CaseForm/
│   │   │   ├── CaseSearch/
│   │   │   └── index.ts
│   │   ├── paste-tool/               # Sophisticated paste functionality
│   │   │   ├── PasteHandler/
│   │   │   ├── ContentDetector/
│   │   │   ├── QuickCaseCreator/
│   │   │   └── index.ts
│   │   ├── image-gallery/            # WebP image gallery with annotations
│   │   │   ├── ImageCarousel/
│   │   │   ├── ImageViewer/
│   │   │   ├── AnnotationEditor/
│   │   │   ├── AnnotationTools/
│   │   │   └── index.ts
│   │   ├── cli-terminal/             # Built-in CLI terminal
│   │   │   ├── Terminal/
│   │   │   ├── CommandProcessor/
│   │   │   ├── CommandHistory/
│   │   │   └── index.ts
│   │   ├── hivemind/                 # Hivemind report generation
│   │   │   ├── HivemindGenerator/
│   │   │   ├── LLMPromptBuilder/
│   │   │   ├── ValidationEngine/
│   │   │   ├── InfoRequestGenerator/
│   │   │   └── index.ts
│   │   ├── analytics/                # Analytics and reporting
│   │   │   ├── Dashboard/
│   │   │   ├── MetricsCards/
│   │   │   ├── TrendAnalysis/
│   │   │   └── index.ts
│   │   └── customers/                # Customer relationship management
│   │       ├── CustomerList/
│   │       ├── CustomerProfile/
│   │       ├── InteractionHistory/
│   │       └── index.ts
│   ├── services/                     # Business logic services
│   │   ├── database/                 # IndexedDB abstraction
│   │   │   ├── db.ts                 # Dexie database setup
│   │   │   ├── repositories/         # Repository pattern implementation
│   │   │   │   ├── CaseRepository.ts
│   │   │   │   ├── CustomerRepository.ts
│   │   │   │   ├── InboxRepository.ts
│   │   │   │   ├── HivemindRepository.ts
│   │   │   │   ├── ImageGalleryRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── migrations/           # Database schema migrations
│   │   │       ├── v1.ts
│   │   │       └── index.ts
│   │   ├── content-processing/       # Content analysis and processing
│   │   │   ├── ContentDetector.ts
│   │   │   ├── UrlProcessor.ts
│   │   │   ├── LogParser.ts
│   │   │   ├── ImageProcessor.ts
│   │   │   ├── WebPConverter.ts
│   │   │   └── index.ts
│   │   ├── pattern-matching/         # Pattern recognition and suggestions
│   │   │   ├── PatternMatcher.ts
│   │   │   ├── SimilarityEngine.ts
│   │   │   ├── SuggestionEngine.ts
│   │   │   └── index.ts
│   │   ├── search/                   # Full-text search implementation
│   │   │   ├── SearchEngine.ts
│   │   │   ├── Indexer.ts
│   │   │   ├── QueryProcessor.ts
│   │   │   └── index.ts
│   │   ├── annotations/              # Image annotation system
│   │   │   ├── AnnotationEngine.ts
│   │   │   ├── LayerManager.ts
│   │   │   ├── CanvasRenderer.ts
│   │   │   └── index.ts
│   │   ├── cli/                      # CLI command system
│   │   │   ├── CommandRegistry.ts
│   │   │   ├── CommandExecutor.ts
│   │   │   ├── commands/             # Individual command implementations
│   │   │   │   ├── CaseCommands.ts
│   │   │   │   ├── SearchCommands.ts
│   │   │   │   ├── AnalyticsCommands.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── hivemind/                 # Hivemind generation logic
│   │   │   ├── PromptGenerator.ts
│   │   │   ├── ResponseParser.ts
│   │   │   ├── ValidationEngine.ts
│   │   │   ├── InfoRequestGenerator.ts
│   │   │   └── index.ts
│   │   └── analytics/                # Analytics and metrics
│   │       ├── MetricsCalculator.ts
│   │       ├── TrendAnalyzer.ts
│   │       ├── OpportunityDetector.ts
│   │       └── index.ts
│   ├── stores/                       # Zustand state management
│   │   ├── useAppStore.ts            # Global application state
│   │   ├── useCaseStore.ts           # Case management state
│   │   ├── useInboxStore.ts          # Inbox state
│   │   ├── useImageGalleryStore.ts   # Image gallery state
│   │   ├── useTerminalStore.ts       # CLI terminal state
│   │   ├── useSettingsStore.ts       # User settings state
│   │   └── index.ts
│   ├── hooks/                        # Custom React hooks
│   │   ├── useDatabase.ts            # Database connection hook
│   │   ├── useSearch.ts              # Search functionality hook
│   │   ├── usePatternMatching.ts     # Pattern matching hook
│   │   ├── useClipboard.ts           # Clipboard handling hook
│   │   ├── useImageProcessing.ts     # Image processing hook
│   │   └── index.ts
│   ├── types/                        # TypeScript type definitions
│   │   ├── database.ts               # Database schema types
│   │   ├── case.ts                   # Case-related types
│   │   ├── customer.ts               # Customer types
│   │   ├── hivemind.ts               # Hivemind report types
│   │   ├── inbox.ts                  # Inbox item types
│   │   ├── image.ts                  # Image and annotation types
│   │   ├── cli.ts                    # CLI command types
│   │   └── index.ts
│   ├── utils/                        # Utility functions
│   │   ├── date.ts                   # Date formatting utilities
│   │   ├── file.ts                   # File handling utilities
│   │   ├── url.ts                    # URL processing utilities
│   │   ├── validation.ts             # Form validation utilities
│   │   ├── encryption.ts             # Client-side encryption
│   │   ├── export.ts                 # Data export utilities
│   │   └── index.ts
│   ├── constants/                    # Application constants
│   │   ├── database.ts               # Database configuration
│   │   ├── hivemind.ts               # Hivemind templates and components
│   │   ├── patterns.ts               # Default patterns and rules
│   │   ├── commands.ts               # CLI command definitions
│   │   └── index.ts
│   ├── styles/                       # Global styles and Tailwind config
│   │   ├── globals.css               # Global CSS
│   │   ├── components.css            # Component-specific styles
│   │   └── tailwind.css              # Tailwind imports
│   ├── App.tsx                       # Main application component
│   ├── index.tsx                     # Application entry point
│   └── vite-env.d.ts                 # Vite type definitions
├── tests/                            # Manual testing scenarios (for LLM)
│   ├── case-management.md            # Case management test scenarios
│   ├── image-processing.md           # Image processing test scenarios
│   ├── hivemind-generation.md        # Hivemind generation test scenarios
│   ├── cli-commands.md               # CLI testing scenarios
│   └── integration-tests.md          # End-to-end test scenarios
├── docs/                             # Documentation
│   ├── architecture/                 # Architecture documents
│   │   ├── backend-architecture.md   # This document
│   │   ├── coding-standards.md       # Existing coding standards
│   │   ├── source-tree.md            # Existing source tree
│   │   └── tech-stack.md             # Existing tech stack
│   ├── user-guides/                  # User documentation
│   │   ├── getting-started.md
│   │   ├── case-management.md
│   │   ├── image-annotation.md
│   │   ├── cli-reference.md
│   │   └── hivemind-reports.md
│   └── brief.md                      # Project brief (existing)
├── docker/                           # Docker configuration
│   ├── Dockerfile                    # Production container
│   ├── Dockerfile.dev                # Development container
│   └── nginx.conf                    # Nginx configuration
├── scripts/                          # Build and utility scripts
│   ├── build.js                      # Custom build script
│   ├── deploy.js                     # Deployment script
│   ├── docker-build.sh               # Docker build script
│   └── dev-setup.js                  # Development environment setup
├── .gitignore                        # Git ignore rules
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── vite.config.ts                    # Vite build configuration
├── docker-compose.yml                # Docker Compose configuration
├── package.json                      # Dependencies and scripts
├── package-lock.json                 # Dependency lock file
└── README.md                         # Project overview and setup
```

## Key Architectural Decisions Reflected in Source Tree:

1. **Component-First Organization**: Each major feature has its own component directory
2. **Service Layer Separation**: Business logic separated from UI components
3. **Repository Pattern**: Database access abstracted through repositories
4. **Hook-Based Architecture**: Custom hooks for reusable logic
5. **Type Safety**: Comprehensive TypeScript definitions
6. **Local-First Structure**: No server-side directories needed
7. **Feature Modules**: Related functionality grouped together
8. **Testing Strategy**: Manual test scenarios documented for LLM verification

## Rationale for this structure:
- **Scalability**: Easy to add new features without restructuring
- **Maintainability**: Clear separation of concerns
- **Local-First Design**: All code runs in browser, no backend needed
- **TypeScript Integration**: Strong typing throughout the application
- **Component Reusability**: Shared components easily imported
- **Service Abstraction**: Business logic separate from UI concerns
- **Testing Documentation**: Clear scenarios for LLM-based testing