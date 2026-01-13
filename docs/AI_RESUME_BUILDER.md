# AI-Powered Resume Builder - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Setup & Configuration](#setup--configuration)
5. [User Guide](#user-guide)
6. [API Documentation](#api-documentation)
7. [Technical Architecture](#technical-architecture)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The AI-Powered Resume Builder is an intelligent feature that helps students create professional, ATS-friendly resumes using Mistral AI. The system enhances user-provided information with professional language, action verbs, and quantifiable achievements.

### Key Capabilities

- **AI Enhancement**: Automatically improves resume content using Mistral AI
- **Draft Management**: Save and edit resumes over time
- **PDF Export**: Generate professional PDF resumes with custom layouts
- **Alumni Review**: Submit resumes for expert feedback
- **Real-time Validation**: Ensure data quality before submission

---

## Features

### ✨ For Students

1. **AI-Powered Generation**
   - Provide basic information
   - AI enhances descriptions with professional language
   - Generates compelling professional summaries
   - Optimizes for Applicant Tracking Systems (ATS)

2. **Build from Scratch**
   - Step-by-step form interface
   - Add multiple experiences, education entries, skills, and projects
   - Real-time validation
   - Save drafts for later editing

3. **PDF Export**
   - Download professionally formatted PDF
   - Clean, modern layout
   - ATS-friendly formatting
   - Customizable sections

4. **Alumni Review System**
   - Submit resumes for professional feedback
   - Receive ratings and suggestions
   - Track review status

### 👥 For Alumni

1. **Review Dashboard**
   - View pending resume submissions
   - Provide ratings (1-5 stars)
   - Add detailed comments
   - Suggest specific improvements

---

## Quick Start

### Prerequisites

- Node.js v16+
- MongoDB running locally or Atlas connection
- Mistral AI API key ([Get one here](https://console.mistral.ai/))

### 3-Step Setup

**Step 1: Configure API Key**

Add to `backend/.env`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

**Step 2: Install Dependencies**

```bash
cd backend
npm install
```

**Step 3: Start Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access at: http://localhost:5173

---

## Setup & Configuration

### Backend Configuration

#### Environment Variables

Required in `backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/college_media

# Authentication
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173

# AI Service (Required for Resume Builder)
MISTRAL_API_KEY=your_mistral_api_key_here
```

#### Dependencies

The following packages are automatically installed:

```json
{
  "axios": "^1.6.0",      // For Mistral API calls
  "pdfkit": "^0.15.0"     // For PDF generation
}
```

### Frontend Configuration

API timeout is set to 60 seconds for AI operations in `frontend/src/services/apiConfig.js`:

```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TIMEOUT: 60000, // 60 seconds for AI calls
  // ...
};
```

---

## User Guide

### For Students

#### Creating a Resume with AI

1. **Navigate to Resume Builder**
   - Click "Build Resume" in the sidebar
   - You'll see the AI-Powered Resume Generation interface

2. **Fill in Your Information**

   **Personal Information** (Required):
   - Full Name
   - Email
   - Phone Number (optional)
   - LinkedIn URL (optional)
   - Professional Summary (optional - AI can generate)

   **Experience**:
   - Job Title
   - Company Name
   - Duration (e.g., "Jan 2020 - Present")
   - Description (AI will enhance this)

   **Education**:
   - Degree/Course
   - Institution/College
   - Year of Completion
   - GPA (optional)

   **Skills**:
   - Enter comma-separated (e.g., "JavaScript, React, Node.js")

   **Projects** (optional):
   - Project Title
   - Description
   - Link (GitHub, website, etc.)

3. **Generate with AI**
   - Click the **"Generate Resume with AI"** button
   - Wait 5-15 seconds for AI processing
   - Review the enhanced content
   - AI will:
     - Improve descriptions with action verbs
     - Add quantifiable achievements
     - Generate professional summary
     - Optimize for ATS systems

4. **Review & Edit**
   - Check all generated content
   - Make any necessary edits
   - Ensure all dates and facts are accurate

5. **Save & Submit**
   - **"Save as Draft"**: Keep working on it later
   - **"Submit for Review"**: Send to alumni for feedback
   - **"Download PDF"**: Export as professional PDF

#### Tips for Better Results

**Provide Detailed Information**:
- ❌ "Worked on projects"
- ✅ "Led development of 3 web applications serving 1000+ users"

**Include Numbers**:
- ❌ "Improved performance"
- ✅ "Improved application performance by 40%"

**Be Specific**:
- ❌ "Managed team"
- ✅ "Managed team of 5 developers across 3 projects"

#### Downloading PDF

1. Fill in your resume information
2. Click **"Generate Resume with AI"** (optional but recommended)
3. Review the content
4. Click **"Download PDF"** button
5. PDF will be generated and downloaded automatically

The PDF includes:
- Professional header with contact information
- Professional summary section
- Chronological work experience
- Education details
- Skills organized by category
- Projects with links
- Clean, ATS-friendly formatting

### For Alumni

#### Reviewing Resumes

1. **Access Review Dashboard**
   - Navigate to "Resume Review" section
   - View list of pending submissions

2. **Select a Resume**
   - Click **"Review Now"** on any resume
   - View student's information
   - Review resume content or download PDF

3. **Provide Feedback**

   **Rating** (1-5 stars):
   - 5 stars: Excellent, ready to submit
   - 4 stars: Very good, minor improvements
   - 3 stars: Good, needs some work
   - 2 stars: Needs significant improvement
   - 1 star: Major revisions required

   **Comments**:
   - Provide detailed feedback
   - Highlight strengths
   - Identify areas for improvement

   **Actionable Suggestions** (one per line):
   ```
   - Use more action verbs (Led, Developed, Implemented)
   - Quantify achievements with metrics
   - Remove high school education
   - Add link to portfolio
   - Reduce job descriptions to 3-4 bullets
   ```

4. **Submit Review**
   - Click **"Submit Review"**
   - Resume status changes to "reviewed"
   - Student receives notification

---

## API Documentation

### Resume Endpoints

#### Generate Resume with AI

```http
POST /api/resume/generate
```

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "linkedin": "linkedin.com/in/johndoe",
    "summary": "Optional summary"
  },
  "experience": [
    {
      "title": "Software Developer",
      "company": "Tech Corp",
      "duration": "Jan 2022 - Present",
      "description": "Developed web applications"
    }
  ],
  "education": [
    {
      "degree": "B.Sc Computer Science",
      "institution": "State University",
      "year": "2021",
      "gpa": "3.8"
    }
  ],
  "skills": ["JavaScript", "React", "Node.js"],
  "projects": [
    {
      "title": "E-commerce Platform",
      "description": "Built full-stack application",
      "link": "github.com/user/project"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Resume generated successfully using AI",
  "data": {
    "_id": "resume_id",
    "student": "user_id",
    "content": {
      "experience": [...],
      "education": [...],
      "skills": [...],
      "projects": [...]
    },
    "summary": "AI-generated professional summary",
    "status": "draft",
    "aiGenerated": true,
    "createdAt": "2026-01-13T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing required data
- `500`: AI generation failed or API key not configured

---

#### Save/Update Resume

```http
POST /api/resume
```

**Authentication**: Required

**Request Body**:
```json
{
  "experience": [...],
  "education": [...],
  "skills": ["skill1", "skill2"],
  "projects": [...],
  "status": "draft" // or "submitted"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Resume saved successfully",
  "data": { /* resume object */ }
}
```

---

#### Get User's Resume

```http
GET /api/resume/my-resume
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": { /* resume object */ }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "No resume found. Please create one first."
}
```

---

#### Download Resume as PDF

```http
GET /api/resume/download/:id
```

**Authentication**: Required

**Response**: PDF file (application/pdf)

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume.pdf"
```

---

#### Get Resume Feed (Alumni Only)

```http
GET /api/resume/feed
```

**Authentication**: Required (Alumni role)

**Response** (200 OK):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "resume_id",
      "student": {
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "profilePicture": "url"
      },
      "content": { /* resume content */ },
      "status": "submitted",
      "updatedAt": "2026-01-13T10:00:00.000Z"
    }
  ]
}
```

---

#### Submit Review (Alumni Only)

```http
POST /api/resume/:id/review
```

**Authentication**: Required (Alumni role)

**Request Body**:
```json
{
  "rating": 5,
  "comments": "Excellent resume with clear achievements",
  "suggestions": [
    "Add more quantifiable metrics",
    "Consider adding portfolio link"
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": { /* review object */ }
}
```

---

## Technical Architecture

### System Components

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       ├─→ MongoDB (Resume storage)
       │
       ├─→ Mistral AI API (Content generation)
       │
       └─→ PDFKit (PDF generation)
```

### File Structure

```
backend/
├── services/
│   ├── aiService.js         # Mistral AI integration
│   └── pdfService.js        # PDF generation
├── routes/
│   └── resume.js            # Resume endpoints
├── models/
│   ├── Resume.js            # Resume schema
│   └── ResumeReview.js      # Review schema
└── .env                     # Configuration

frontend/
├── src/
│   ├── pages/
│   │   ├── ResumeBuilder.jsx        # Main resume builder
│   │   └── AlumniResumeReview.jsx   # Alumni review interface
│   └── services/
│       ├── api.js           # API client
│       └── apiConfig.js     # Timeout: 60s for AI calls
```

### Database Schema

**Resume Model**:
```javascript
{
  student: ObjectId (ref: User),
  content: {
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: String,
      gpa: String
    }],
    skills: [String],
    projects: [{
      title: String,
      description: String,
      link: String
    }]
  },
  summary: String,
  fileUrl: String,
  status: String (draft|submitted|reviewed),
  aiGenerated: Boolean,
  assignedAlumni: ObjectId (ref: User),
  timestamps: true
}
```

### AI Service Flow

```
1. User fills form
        ↓
2. Frontend sends to /resume/generate
        ↓
3. Backend calls Mistral AI API
   - Prompt engineering with context
   - Professional enhancement
   - ATS optimization
        ↓
4. Parse AI response
   - Extract JSON structure
   - Convert arrays to strings
   - Normalize data
        ↓
5. Save to MongoDB
        ↓
6. Return enhanced content to frontend
```

### PDF Generation Flow

```
1. User clicks "Download PDF"
        ↓
2. Frontend calls /resume/download/:id
        ↓
3. Backend retrieves resume from DB
        ↓
4. PDFKit generates PDF
   - Header with contact info
   - Professional summary
   - Experience with bullets
   - Education details
   - Skills section
   - Projects with links
        ↓
5. Stream PDF to client
        ↓
6. Browser downloads file
```

---

## Troubleshooting

### Common Issues

#### 1. "Mistral API key not configured"

**Symptoms**:
- Error message in UI
- Backend logs: "MISTRAL_API_KEY: NOT FOUND"

**Solution**:
```bash
# 1. Verify .env file location
ls backend/.env

# 2. Check .env content
cat backend/.env | grep MISTRAL

# 3. Ensure no extra spaces
MISTRAL_API_KEY=sk-xxx  # ✅ Correct
MISTRAL_API_KEY = sk-xxx  # ❌ Spaces cause issues

# 4. Restart backend
cd backend
npm run dev
```

**Verification**:
Look for this in backend logs:
```
============================================================
🔍 ENVIRONMENT VARIABLE CHECK:
MISTRAL_API_KEY: EXISTS (length: 32)
============================================================
```

---

#### 2. AI Generation Timeout

**Symptoms**:
- "timeout of 60000ms exceeded"
- Request hangs for 60 seconds

**Causes**:
- Slow network connection
- Mistral API rate limits
- Invalid API key
- Large resume data

**Solutions**:

**A. Check API key validity**:
```bash
# Test API key manually
curl https://api.mistral.ai/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**B. Increase timeout** (if needed):

`frontend/src/services/apiConfig.js`:
```javascript
TIMEOUT: 90000, // 90 seconds
```

**C. Check backend logs**:
```
🔥 /resume/generate HIT
➡️ Starting AI generation...
```

If stuck here → Mistral API issue

---

#### 3. PDF Download Not Working

**Symptoms**:
- PDF doesn't download
- Error: "Failed to generate PDF"

**Solutions**:

**A. Check if pdfkit is installed**:
```bash
cd backend
npm list pdfkit
```

**B. Verify resume exists**:
```javascript
// Backend should log:
💾 Saving resume to database...
✅ Resume saved successfully
```

**C. Check browser console**:
- Look for 404 or 500 errors
- Verify resume ID is correct

**D. Manual test**:
```bash
# Get your resume ID from MongoDB
curl http://localhost:5000/api/resume/download/RESUME_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o test.pdf
```

---

#### 4. Resume Not Saving

**Symptoms**:
- Click "Save as Draft" but data disappears
- Status doesn't update

**Solutions**:

**A. Check authentication**:
- Ensure JWT token is valid
- Look for 401 errors in console

**B. Verify MongoDB connection**:
```
MongoDB connected successfully
```

**C. Check validation**:
- At least one experience or education entry required
- Skills should be comma-separated

---

#### 5. AI Returns Poor Quality Content

**Symptoms**:
- Generic descriptions
- Lacks specific details
- Not relevant to input

**Solutions**:

**Provide More Detail**:
```javascript
// ❌ Bad input
{
  title: "Developer",
  company: "Company",
  description: "Did coding"
}

// ✅ Good input
{
  title: "Senior Full Stack Developer",
  company: "TechCorp Solutions",
  description: "Led development of microservices architecture serving 50k users, reduced API response time by 60%, mentored 3 junior developers"
}
```

**Include Numbers**:
- Percentages
- Dollar amounts
- User counts
- Time saved
- Team sizes

---

### Debug Mode

Enable comprehensive logging:

**Backend** (`routes/resume.js`):
```javascript
// Already enabled:
console.log('🔥 /resume/generate HIT');
console.log('➡️ Starting AI generation...');
console.log('📊 Data received:', {...});
console.log('✅ AI generation finished');
```

**Frontend** (browser console):
```javascript
// Check network tab:
- POST /api/resume/generate
- Status: 200 (success) or 500 (error)
- Response: Check error message
```

---

## Best Practices

### For Students

#### Resume Content

**1. Use Action Verbs**:
- Led, Developed, Implemented, Designed
- Spearheaded, Orchestrated, Pioneered
- Achieved, Delivered, Optimized

**2. Quantify Everything**:
- "Reduced load time by 40%"
- "Managed team of 5 developers"
- "Increased user engagement by 25%"
- "Saved $50K annually"

**3. Be Specific**:
- Technologies used
- Project scope and impact
- Your specific role
- Measurable outcomes

**4. Keep It Concise**:
- 3-5 bullet points per experience
- 1-2 line descriptions
- Focus on achievements, not duties

**5. Tailor to Job**:
- Emphasize relevant skills
- Highlight related experience
- Match keywords from job posting

#### Resume Structure

**Recommended Order**:
1. Contact Information
2. Professional Summary (2-3 lines)
3. Experience (reverse chronological)
4. Education
5. Skills (categorized)
6. Projects (3-5 most impressive)
7. Certifications (if any)

**Length**:
- Students/Early Career: 1 page
- 3-10 years experience: 1-2 pages
- 10+ years: 2 pages maximum

### For Alumni Reviewers

#### Providing Effective Feedback

**1. Be Constructive**:
- Start with positives
- Specific improvement suggestions
- Explain the "why" behind feedback

**2. Focus on Impact**:
- Help quantify achievements
- Suggest stronger action verbs
- Identify missing metrics

**3. Check for Errors**:
- Grammar and spelling
- Consistent formatting
- Date accuracy

**4. Industry-Specific Advice**:
- Tailor feedback to their field
- Recommend relevant skills
- Suggest industry keywords

**5. Actionable Suggestions**:
```
✅ Good: "Add metrics to your project description, like number of users or performance improvement percentage"

❌ Too vague: "Make it better"
```

### For Developers

#### Code Maintenance

**1. Monitor AI Costs**:
```javascript
// Track API usage
console.log('AI tokens used:', response.usage);
```

**2. Error Handling**:
```javascript
// Always wrap AI calls
try {
  const result = await aiService.generateResume(data);
} catch (error) {
  // Fallback to original data
  console.error('AI failed:', error);
  return originalData;
}
```

**3. Rate Limiting**:
```javascript
// Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per 15 min
});
app.use('/api/resume/generate', limiter);
```

**4. Caching**:
```javascript
// Cache generated content
// Don't regenerate unchanged resumes
```

**5. Testing**:
```bash
# Test AI service
node backend/testAI.js

# Expected output:
✅ SUCCESS! AI Resume Generated
```

---

## Support & Resources

### Documentation Links

- [Mistral AI Documentation](https://docs.mistral.ai/)
- [PDFKit Guide](https://pdfkit.org/docs/getting_started.html)
- [Mongoose Schema Guide](https://mongoosejs.com/docs/guide.html)

### Getting Help

**Issue Types**:
1. **Setup Issues**: Check environment variables and dependencies
2. **AI Issues**: Verify API key and test with testAI.js
3. **PDF Issues**: Check pdfkit installation and file permissions
4. **Frontend Issues**: Check browser console and network tab

### Performance Tips

**Backend**:
- Use connection pooling for MongoDB
- Implement request caching
- Add CDN for static assets

**Frontend**:
- Debounce AI generation button
- Show loading states clearly
- Cache API responses locally

**AI**:
- Use appropriate model (mistral-large for best quality)
- Optimize prompts for conciseness
- Implement retry logic for failures

---

## Changelog

### Version 1.0.0 (January 2026)

**Features**:
- ✅ AI-powered resume generation using Mistral AI
- ✅ Draft management system
- ✅ PDF export with professional layout
- ✅ Alumni review system
- ✅ Real-time validation
- ✅ Auto-save functionality
- ✅ Comprehensive error handling
- ✅ Timeout protection (60s)

**Technical**:
- Mistral AI API integration
- PDFKit for PDF generation
- MongoDB for data persistence
- JWT authentication
- Rate limiting
- Error logging

---

## License

This project is part of College Media platform.

---

## Contributors

Built with ❤️ for College Media students

For questions or support, contact the development team.
