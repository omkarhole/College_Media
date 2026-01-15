# Deployment Guide

This guide provides comprehensive instructions for deploying the College Media platform to various hosting platforms and environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Azure Deployment](#azure-deployment)
- [Database Setup](#database-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- **Domain Name**: Registered domain for production
- **SSL Certificate**: For HTTPS (most platforms provide this)
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **File Storage**: AWS S3 or compatible service
- **Email Service**: Resend, SendGrid, or similar
- **Monitoring**: Application monitoring service (optional)

### Required Accounts

- [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [AWS Account](https://aws.amazon.com) (for S3 and optional EC2)
- [Azure Account](https://azure.microsoft.com) (alternative to AWS)

## Environment Configuration

### Environment Variables

Create environment files for different stages:

#### Production (.env.production)
```env
# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_media_prod

# Authentication
JWT_SECRET=your-production-jwt-secret
ACCESS_TOKEN_SECRET=your-production-access-secret
REFRESH_TOKEN_SECRET=your-production-refresh-secret

# Email Service
RESEND_API_KEY=your-production-resend-key

# AWS Services
AWS_ACCESS_KEY_ID=your-production-aws-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-production-s3-bucket

# Redis (if using Redis Cloud or similar)
REDIS_URL=redis://username:password@your-redis-host:port

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Staging (.env.staging)
```env
# Similar to production but with staging URLs and databases
NODE_ENV=staging
CLIENT_URL=https://staging.yourdomain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_media_staging
```

### Environment Variable Management

- **Vercel**: Set in project settings > Environment Variables
- **Netlify**: Set in site settings > Environment variables
- **Docker**: Use `.env` file or docker-compose environment
- **AWS/Azure**: Use their respective secret management services

## Vercel Deployment

### Frontend Deployment

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Set different values for production and preview deployments

4. **Domain Configuration**
   - Go to project settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

5. **Deploy**
   - Push to main branch or create deployment manually
   - Vercel will automatically build and deploy

### Backend Deployment (Serverless)

1. **API Routes Setup**
   - Move API routes to `api/` directory in frontend
   - Convert Express routes to serverless functions

2. **Database Connection**
   - Use MongoDB connection string in environment variables
   - Implement connection pooling for serverless

3. **CORS Configuration**
   ```javascript
   // api/cors.js
   export default function handler(req, res) {
     res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL);
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     res.status(200).end();
   }
   ```

4. **Environment Variables**
   - Set all backend environment variables in Vercel

## Netlify Deployment

### Frontend Deployment

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add all required variables

4. **Domain Setup**
   - Go to Site settings > Domain management
   - Add custom domain
   - Configure DNS

### Backend Deployment (Netlify Functions)

1. **Functions Setup**
   - Create `netlify/functions/` directory
   - Convert Express routes to Netlify functions

2. **Database Connection**
   - Use MongoDB Atlas connection string
   - Implement connection caching

3. **CORS Headers**
   ```javascript
   exports.handler = async (event, context) => {
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': process.env.CLIENT_URL,
         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
         'Access-Control-Allow-Headers': 'Content-Type, Authorization',
       },
       body: JSON.stringify({ message: 'Success' }),
     };
   };
   ```

## Docker Deployment

### Dockerfile (Frontend)

```dockerfile
# Multi-stage build for React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/college_media
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### Running Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up --build

# Or run individually
docker build -t college-media-frontend ./frontend
docker build -t college-media-backend ./backend
docker run -p 3000:80 college-media-frontend
docker run -p 5000:5000 college-media-backend
```

## AWS Deployment

### EC2 + Docker Deployment

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - t3.medium or larger for production
   - Configure security groups (ports 22, 80, 443, 5000)

2. **Install Docker**
   ```bash
   # Update system
   sudo yum update -y  # Amazon Linux
   # or
   sudo apt update && sudo apt upgrade -y  # Ubuntu

   # Install Docker
   sudo amazon-linux-extras install docker  # Amazon Linux
   # or
   sudo apt install docker.io  # Ubuntu

   # Start Docker
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/college-media.git
   cd college-media

   # Run with docker-compose
   sudo docker-compose up -d
   ```

4. **Configure Load Balancer**
   - Create Application Load Balancer
   - Configure target groups for frontend (port 3000) and backend (port 5000)
   - Set up SSL certificate with ACM

### ECS Fargate Deployment

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name college-media-frontend
   aws ecr create-repository --repository-name college-media-backend
   ```

2. **Build and Push Images**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag images
   docker build -t college-media-frontend ./frontend
   docker build -t college-media-backend ./backend

   # Tag for ECR
   docker tag college-media-frontend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   docker tag college-media-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-backend:latest

   # Push images
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-backend:latest
   ```

3. **Create ECS Cluster**
   - Use Fargate launch type
   - Create task definitions for frontend and backend
   - Set up services with load balancers

## Azure Deployment

### App Service Deployment

1. **Create App Service**
   - Go to Azure Portal > App Services
   - Create Web App for frontend (Node.js runtime)
   - Create API App for backend (Node.js runtime)

2. **Configure Deployment**
   - Connect to GitHub repository
   - Set deployment branch
   - Configure build settings

3. **Environment Variables**
   - Set in App Service > Configuration > Application settings

4. **Database Setup**
   - Use Azure Cosmos DB (MongoDB API) or Azure Database for MongoDB

### Container Instances

1. **Create Container Registry**
   ```bash
   az acr create --resource-group your-rg --name youracr --sku Basic
   ```

2. **Build and Push Images**
   ```bash
   # Login to ACR
   az acr login --name youracr

   # Build and tag images
   docker build -t youracr.azurecr.io/college-media-frontend ./frontend
   docker build -t youracr.azurecr.io/college-media-backend ./backend

   # Push images
   docker push youracr.azurecr.io/college-media-frontend
   docker push youracr.azurecr.io/college-media-backend
   ```

3. **Deploy to Container Instances**
   ```bash
   az container create \
     --resource-group your-rg \
     --name college-media-frontend \
     --image youracr.azurecr.io/college-media-frontend \
     --dns-name-label college-media-frontend \
     --ports 80
   ```

## Database Setup

### MongoDB Atlas

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new project and cluster
   - Choose cloud provider and region

2. **Configure Database Access**
   - Create database user
   - Add IP whitelist (0.0.0.0/0 for development, specific IPs for production)

3. **Create Database**
   - Connect to cluster
   - Create database: `college_media`
   - Create collections as needed

4. **Connection String**
   - Get connection string from Atlas dashboard
   - Replace credentials and database name
   - Use in environment variables

### Database Migration

```javascript
// migration script example
const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Add new fields to existing documents
    await mongoose.connection.collection('users').updateMany(
      { twoFactorEnabled: { $exists: false } },
      { $set: { twoFactorEnabled: false } }
    );

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
```

## Monitoring and Logging

### Application Monitoring

#### Vercel/Netlify Analytics
- Built-in performance monitoring
- Real-time error tracking
- User analytics

#### External Monitoring (Recommended)

**Sentry for Error Tracking**
```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// Frontend error tracking
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Backend Error Tracking**
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### Logging Setup

#### Winston Logger Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'college-media' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

#### Log Aggregation

**AWS CloudWatch (for AWS deployments)**
- Automatic log collection from EC2/ECS
- Log insights and monitoring
- Integration with CloudWatch alarms

**Azure Application Insights**
- Comprehensive application monitoring
- Performance metrics and error tracking
- Integration with Azure Monitor

### Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    // Check Redis connection (if used)
    if (redisClient) {
      await redisClient.ping();
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisClient ? 'connected' : 'not configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for missing environment variables during build

#### Runtime Errors
- Verify environment variables are set correctly
- Check database connectivity
- Validate API endpoints and CORS settings

#### Performance Issues
- Monitor resource usage (CPU, memory)
- Check database query performance
- Implement caching where appropriate

#### SSL/HTTPS Issues
- Verify certificate installation
- Check domain DNS configuration
- Ensure proper redirect rules

### Rollback Strategy

1. **Version Tagging**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **Quick Rollback**
   - Most platforms support instant rollback to previous deployment
   - Keep backup of database before major migrations

3. **Blue-Green Deployment**
   - Deploy to staging environment first
   - Test thoroughly before production deployment
   - Use feature flags for gradual rollouts

### Support and Resources

- **Platform Documentation**:
  - [Vercel Docs](https://vercel.com/docs)
  - [Netlify Docs](https://docs.netlify.com)
  - [Docker Docs](https://docs.docker.com)
  - [AWS Docs](https://docs.aws.amazon.com)
  - [Azure Docs](https://docs.microsoft.com/azure)

- **Community Support**:
  - [GitHub Issues](https://github.com/Ewocs/College_Media/issues)
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/college-media)

- **Monitoring Tools**:
  - [Sentry](https://sentry.io)
  - [DataDog](https://datadoghq.com)
  - [New Relic](https://newrelic.com)

This deployment guide covers the most common deployment scenarios. For specific requirements or custom deployments, please refer to the platform-specific documentation or create an issue for additional guidance.