# Smart Support Agent

A local-first intelligent support case management system built with React, TypeScript, and IndexedDB. Features content processing, image annotation, CLI terminal integration, and pattern matching for similar cases.

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (Recommended - easiest setup)
- OR **Node.js 18+** and **npm**

### Option 1: Docker (Recommended) 🐳

```bash
# Clone the repository
git clone <repository-url>
cd supportAgency

# Start development environment
docker-compose --profile dev up

# Access the application
# 👉 http://localhost:5173
```

### Option 2: Local Development 💻

```bash
# Clone and install
git clone <repository-url>
cd supportAgency
npm install

# Start development server
npm run dev

# Access the application  
# 👉 http://localhost:5173
```

## 📋 Available Commands

### Docker Commands
```bash
# Development (with hot reload)
docker-compose --profile dev up

# Production build
docker-compose up

# Build images
docker-compose build

# Stop containers
docker-compose down

# View logs
docker-compose logs app-dev
```

### NPM Commands
```bash
# Development
npm run dev              # Start dev server at http://localhost:5173

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint

# Docker shortcuts
npm run docker:dev       # Run dev environment
npm run docker:prod      # Run production environment
npm run docker:build     # Build Docker images
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.1.0 with @ path aliases
- **Styling**: Tailwind CSS 3.3.5 + Headless UI
- **State Management**: Zustand 4.4.7
- **Database**: IndexedDB via Dexie.js 3.2.4
- **Terminal**: xterm.js 5.3.0
- **Routing**: React Router v6
- **Containerization**: Docker + Docker Compose

### Key Features
- 🗂️ **Case Management**: Create, track, and resolve support cases
- 📥 **Intelligent Inbox**: Content processing and categorization  
- 🖼️ **Image Gallery**: Upload, annotate, and manage images
- 📊 **Analytics Dashboard**: Insights and pattern recognition
- ⌨️ **CLI Terminal**: Power user commands and automation
- 🔍 **Smart Search**: Full-text search with pattern matching
- 💾 **Local-First**: All data stored locally in IndexedDB

## 🗄️ Project Structure

```
src/
├── components/         # React components
│   ├── Layout.tsx     # Main application shell
│   ├── Navigation.tsx # Sidebar navigation
│   └── Terminal.tsx   # CLI terminal component
├── pages/             # Page-level components
│   ├── CasesPage.tsx     # Case management
│   ├── InboxPage.tsx     # Content processing
│   ├── ImageGalleryPage.tsx # Image management
│   └── AnalyticsPage.tsx    # Insights dashboard
├── stores/            # Zustand state management
│   └── appStore.ts    # Global application state
├── services/          # Business logic & data access
│   ├── database.ts    # IndexedDB schema
│   └── repositories/ # Data access layer
├── types/             # TypeScript definitions
├── utils/             # Utility functions
└── styles/           # CSS and styling
```

## 🧪 Development & Testing

### Database Testing
Navigate to the **DB Test** page in the application to:
- View IndexedDB statistics
- Run repository tests
- Verify data operations

### Browser Console Testing
```javascript
// Run comprehensive repository tests
import('./src/utils/test-repository').then(m => m.runAllTests())
```

### CLI Terminal Commands
Available in the integrated terminal:
```bash
help         # Show available commands
clear        # Clear terminal
status       # Application status
version      # Version information
cases        # Case management (coming in Story 7)
analytics    # Analytics commands (coming in Story 11)
```

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📱 Responsive Design

- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Collapsible sidebar for space optimization
- **Mobile**: Optimized layout for touch interaction

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development  # or production
```

### Docker Configuration
- **Development**: `docker-compose --profile dev up`
- **Production**: `docker-compose up`
- **Ports**: 
  - Dev: `5173`
  - Prod: `80`

### Build Configuration
- **Vite**: Modern build tool with HMR
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting

## 🚦 Health Checks

The application includes built-in health monitoring:

```bash
# Check Docker container health
docker-compose ps

# Check application status via CLI terminal
# Navigate to app → Terminal → type: status
```

## 📊 Performance

### Target Metrics
- **Startup**: < 3 seconds to fully loaded
- **Case Operations**: < 500ms for CRUD operations  
- **Search**: < 100ms for typical queries
- **Image Processing**: < 2 seconds for 5MB WebP conversion

### Optimization Features
- Code splitting and lazy loading
- Image optimization and WebP conversion
- IndexedDB query optimization
- Component memoization

## 🐛 Troubleshooting

### Common Issues

**Docker Desktop not running:**
```bash
# Start Docker Desktop, then:
docker-compose --profile dev up
```

**Port 5173 already in use:**
```bash
# Kill existing process or change port in docker-compose.yml
docker-compose down
docker-compose --profile dev up
```

**Build failures:**
```bash
# Clear Docker cache and rebuild
docker system prune
docker-compose build --no-cache
```

**Package installation issues:**
```bash
# Clear npm cache
npm cache clean --force
npm install
```

## 🗃️ Data Management

### Local Storage
- **IndexedDB**: Case data, images, settings
- **LocalStorage**: Simple preferences
- **No Backend**: Fully client-side application

### Data Export/Import
- Navigate to Settings (Story 4) for backup functionality
- All data remains on your device

## 📋 Development Status

### ✅ Completed (Epic 1)
- **Story 1**: Project scaffolding & build pipeline
- **Story 2**: IndexedDB schema & repository layer  
- **Story 3**: Application shell & navigation

### 🚧 In Development (Epic 2)
- **Story 5**: Sophisticated paste tool core
- **Story 6**: Image processing & WebP conversion
- **Story 7**: Case management CRUD operations
- **Story 8**: Content categorization engine

### 📋 Planned (Epic 3 & 4)
- Advanced search & pattern matching
- Image annotation tools
- Analytics dashboard
- CLI terminal integration
- Hivemind reporting
- LLM integration workflow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards (ESLint + Prettier)
4. Keep files under 500 lines
5. Add tests for new functionality
6. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check Docker logs: `docker-compose logs app-dev`
4. Open an issue in the repository

---

**Happy coding!** 🎉 Visit http://localhost:5173 after setup to start using the Smart Support Agent.