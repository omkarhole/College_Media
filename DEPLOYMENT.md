# Deployment & Production Guide

This guide provides comprehensive instructions for deploying College Media to production environments. Follow these steps to ensure a smooth and secure deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MongoDB database (Atlas recommended for production)
- ✅ Git repository access
- ✅ Domain name (optional but recommended)
- ✅ SSL certificate (Let's Encrypt for free)

## Build Process

### Frontend Build

The frontend uses Vite for building optimized production bundles.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build artifacts will be stored in the `dist/` directory
```

**Build Output:**
- `dist/` directory contains optimized static files
- HTML, CSS, and JavaScript are minified and bundled
- Assets are optimized with hashes for caching

### Backend Build

The backend runs directly with Node.js (no build step required for basic deployment).

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# For production, dependencies only (no dev dependencies)
npm ci --only=production
```

**Note:** The backend can be deployed directly from source code or containerized.

## Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) - Recommended for Quick Setup

#### Frontend Deployment (Vercel)

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project" and import your GitHub repository
   - Select the `frontend` directory as the root directory

2. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Environment Variables:**
   - Add `VITE_API_URL` pointing to your backend URL
   - Example: `https://college-media-api.onrender.com`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your frontend

#### Backend Deployment (Render)

1. **Create Render Account:**
   - Go to [render.com](https://render.com) and sign up

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory

3. **Configure Service:**
   - **Name:** `college-media-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Environment Variables:**
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret
   PORT=10000
   NODE_ENV=production
   EMAIL_HOST=your_smtp_host
   EMAIL_PORT=587
   EMAIL_USER=your_email
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy your backend

### Option 2: AWS (More Control, Complex)

#### Using AWS Amplify (Frontend) + EC2/Elastic Beanstalk (Backend)

**Frontend (AWS Amplify):**

1. **AWS Console Setup:**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"

2. **Connect Repository:**
   - Choose GitHub and authorize
   - Select repository and `frontend` folder

3. **Build Settings:**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
   ```

4. **Environment Variables:**
   - `VITE_API_URL`: Your backend API URL

**Backend (AWS Elastic Beanstalk):**

1. **Prepare Application:**
   ```bash
   # Create deployment package
   cd backend
   zip -r college-media-backend.zip . -x "node_modules/*" ".git/*"
   ```

2. **EB CLI Setup:**
   ```bash
   # Install EB CLI
   pip install awsebcli

   # Initialize EB application
   eb init college-media-backend --platform node.js --region us-east-1
   ```

3. **Create Environment:**
   ```bash
   eb create production --envvars MONGODB_URI=$MONGODB_URI,JWT_SECRET=$JWT_SECRET
   ```

### Option 3: Docker Deployment

#### Create Dockerfiles

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### Docker Compose for Local Testing

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/college-media
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## Environment Configuration

### Required Environment Variables

**Backend (.env):**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-media

# Security
JWT_SECRET=your_super_secure_random_string_at_least_32_characters

# Server
PORT=5000
NODE_ENV=production

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com
```

**Frontend Environment Variables:**
```env
VITE_API_URL=https://your-backend-domain.com
```

### Security Best Practices

- ✅ Use strong, unique JWT secrets (at least 32 characters)
- ✅ Store secrets in environment variables, never in code
- ✅ Use HTTPS in production
- ✅ Configure CORS properly for your domain
- ✅ Set secure cookie options
- ✅ Use MongoDB Atlas with IP whitelisting

## Production Checklist

### Pre-Deployment

- [ ] **Environment Variables:** All required env vars configured
- [ ] **Database:** MongoDB connection tested and accessible
- [ ] **Build Process:** Frontend builds successfully without errors
- [ ] **Dependencies:** All production dependencies installed
- [ ] **Security:** JWT secrets are strong and unique
- [ ] **CORS:** Properly configured for production domain
- [ ] **SSL:** HTTPS enabled (automatic on Vercel/Render)

### Deployment Steps

- [ ] **Repository:** Code pushed to main branch
- [ ] **CI/CD:** Automated deployment configured
- [ ] **Domain:** Custom domain configured (if applicable)
- [ ] **DNS:** DNS records updated for custom domain
- [ ] **Monitoring:** Error tracking and logging set up

### Post-Deployment Testing

- [ ] **Frontend:** Loads without console errors
- [ ] **Authentication:** User registration and login work
- [ ] **Posts:** Create, view, like/unlike posts work
- [ ] **Chatbot:** AI chatbot responds correctly
- [ ] **Mobile:** Responsive design works on mobile devices
- [ ] **API:** All endpoints return correct responses
- [ ] **Database:** Data persists correctly
- [ ] **Performance:** Page load times acceptable (< 3 seconds)

### Security Verification

- [ ] **HTTPS:** All traffic served over HTTPS
- [ ] **Headers:** Security headers configured (CSP, HSTS, etc.)
- [ ] **Authentication:** JWT tokens properly validated
- [ ] **Input Validation:** All user inputs validated and sanitized
- [ ] **Rate Limiting:** API rate limiting implemented
- [ ] **Logs:** Sensitive data not logged

## Monitoring & Maintenance

### Essential Monitoring

1. **Application Performance:**
   - Response times
   - Error rates
   - User sessions

2. **Infrastructure:**
   - CPU usage
   - Memory usage
   - Database connections

3. **Business Metrics:**
   - User registrations
   - Post creation rate
   - Chatbot interactions

### Recommended Tools

- **Error Tracking:** Sentry or similar
- **Performance:** Vercel Analytics, Render metrics
- **Uptime:** UptimeRobot or Pingdom
- **Logs:** Centralized logging (Winston + cloud service)

### Regular Maintenance

- **Weekly:** Check error logs and performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and optimize database queries
- **Annually:** Security audit and penetration testing

## Troubleshooting

### Common Issues

**Frontend Build Fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Backend Connection Issues:**
- Check MongoDB connection string
- Verify network access and firewall rules
- Test connection with MongoDB Compass

**CORS Errors:**
- Update CORS configuration in backend
- Ensure correct frontend domain in allowed origins

**Environment Variables:**
- Verify all required variables are set
- Check variable names match exactly
- Restart application after changing env vars

### Rollback Procedure

1. **Identify Issue:** Determine what's causing the problem
2. **Stop Traffic:** Temporarily redirect users if needed
3. **Rollback Code:** Deploy previous working version
4. **Restore Data:** If database changes caused issues
5. **Test:** Verify rollback was successful
6. **Investigate:** Analyze what went wrong to prevent future issues

### Support

If you encounter issues not covered here:
1. Check the [GitHub Issues](https://github.com/Ewocs/College_Media/issues)
2. Review application logs
3. Contact the development team

---

**🎉 Congratulations!** Your College Media application is now deployed and production-ready. Monitor performance and user feedback to continuously improve the platform.