# Tech Stack

This is the **DEFINITIVE** technology selection section. All technology choices made here are binding for the entire project and must be referenced by all other documentation.

## Infrastructure Approach
- **Provider:** Local/Browser-based (No cloud provider)
- **Key Services:** Browser APIs (IndexedDB, LocalStorage, File System Access API)
- **Deployment:** Static file hosting or local file system

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Language** | TypeScript | 5.3.3 | Primary development language | Strong typing, excellent tooling, unified across stack |
| **Runtime** | Browser JavaScript | ES2022+ | Client-side execution | No server runtime needed for local-first approach |
| **Build Tool** | Vite | 5.1.0 | Fast development and optimized builds | Modern, fast, excellent for SPA development |
| **Frontend Framework** | React | 18.2.0 | UI framework | Component-based, large ecosystem, matches brief requirements |
| **State Management** | Zustand | 4.5.0 | Global state management | Lightweight, TypeScript-friendly, perfect for local-first apps |
| **Local Database** | Dexie.js | 3.2.4 | IndexedDB wrapper | Powerful queries, TypeScript support, reactive |
| **UI Components** | Tailwind CSS | 3.4.1 | Styling framework | Utility-first, fast development, small bundle size |
| **Component Library** | Headless UI | 1.7.17 | Accessible components | Unstyled, accessible, works great with Tailwind |
| **File Handling** | File System Access API | Native | Local file read/write | Browser native API for file operations |
| **Testing** | Manual/LLM | N/A | Simple testing approach | AI-assisted testing through prompts and verification |
| **Terminal Component** | xterm.js | 5.3.0 | Browser terminal emulator | Full-featured terminal in the browser |
| **Image Processing** | Canvas API | Native | Image annotation | Browser native for image manipulation |
| **Search** | Flexsearch | 0.7.31 | Full-text search | In-browser search, no server needed |
| **Rich Text** | Lexical | 0.13.1 | Text editor framework | Facebook's modern editor, great for case notes |
| **Markdown** | marked | 12.0.0 | Markdown parsing | For formatting case descriptions and reports |
| **Data Sync** | N/A | N/A | No sync needed | Fully local, no backend required |
| **Package Manager** | npm | 10.2.4 | Dependency management | Standard for JavaScript projects |
| **Bundler** | Rollup (via Vite) | 4.9.6 | Production builds | Tree-shaking, code splitting |
| **Development Server** | Vite Dev Server | 5.1.0 | Local development | HMR, fast refresh |
| **Linting** | ESLint | 8.56.0 | Code quality | Catch errors, enforce conventions |
| **Formatting** | Prettier | 3.2.4 | Code formatting | Consistent code style |