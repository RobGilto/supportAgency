# Infrastructure and Deployment

## Docker-First Deployment Strategy

**Primary Method:** Docker containerization for consistent deployment across environments
**Secondary Method:** Static hosting for simple deployments

## Docker Configuration

### Production Dockerfile
```dockerfile
# Multi-stage build for optimized production image
FROM node:20.11.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S smartsupport -u 1001

# Set proper permissions
RUN chown -R smartsupport:nodejs /usr/share/nginx/html && \
    chown -R smartsupport:nodejs /var/cache/nginx && \
    chown -R smartsupport:nodejs /var/log/nginx && \
    chown -R smartsupport:nodejs /etc/nginx/conf.d

# Switch to non-root user
USER smartsupport

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  smart-support-agent:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Development service
  smart-support-agent-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    profiles:
      - dev
```

## Deployment Strategy
- **Strategy:** Docker containerization with orchestration options
- **CI/CD Platform:** GitHub Actions with Docker Hub or GitHub Container Registry
- **Pipeline Configuration:** `.github/workflows/docker-deploy.yml`

## Environments

- **Development:** Docker development container (`docker-compose --profile dev up`)
- **Testing:** Local build testing (`npm run build && npm run preview`)
- **Staging:** Docker container deployment
- **Production:** Docker container with load balancing and monitoring

## Environment Promotion Flow

```
Development (Docker)
    ↓ (git push)
GitHub Repository
    ↓ (automated build)
Docker Registry
    ↓ (deployment)
Staging Environment
    ↓ (manual approval/tag)
Production Environment
```

## Rollback Strategy
- **Primary Method:** Docker image rollback with container orchestration
- **Trigger Conditions:** Health check failures, user-reported critical issues
- **Recovery Time Objective:** < 2 minutes for container rollback

## Container Orchestration Options

### Option 1: Docker Compose (Recommended for single server)
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### Option 2: Docker Swarm (Multi-server)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.production.yml smart-support-agent
```

### Option 3: Kubernetes (Enterprise)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-support-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smart-support-agent
  template:
    metadata:
      labels:
        app: smart-support-agent
    spec:
      containers:
      - name: smart-support-agent
        image: smart-support-agent:latest
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
```

## Enhanced Package.json Scripts
```json
{
  "scripts": {
    "docker:build": "./scripts/docker-build.sh",
    "docker:dev": "docker-compose --profile dev up",
    "docker:prod": "docker-compose up -d",
    "docker:deploy": "./scripts/docker-deploy.sh",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker-compose down && docker system prune -f"
  }
}
```

## Docker Benefits for This Application

1. **Consistency**: Same environment across development, staging, and production
2. **Isolation**: Application runs in its own container with controlled dependencies
3. **Scalability**: Easy horizontal scaling with container orchestration
4. **Security**: Non-root user execution and isolated environment
5. **Portability**: Runs anywhere Docker is supported
6. **Easy Deployment**: Single command deployment
7. **Resource Control**: CPU and memory limits for predictable performance