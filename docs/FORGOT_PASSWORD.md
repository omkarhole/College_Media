# Forgot Password - OTP-Based Password Reset

## Overview

The College Media platform implements a secure OTP-based password reset system that allows users to recover their accounts by verifying their identity through email verification.

## Features

- 🔐 **Secure OTP Generation** - 6-digit random OTP codes
- ⏱️ **Time-Limited OTPs** - OTPs expire after 10 minutes
- 📧 **Email Delivery** - Beautiful HTML email templates with OTP
- 🔄 **Resend Capability** - Users can request a new OTP if needed
- 🛡️ **Token-Based Reset** - Verified OTP generates a temporary reset token (15 minutes)
- 🚫 **User Enumeration Prevention** - Same response for existing and non-existing emails
- 🎨 **Multi-Step UI** - Clean, intuitive 3-step process

## User Flow

```
1. Enter Email → 2. Enter OTP → 3. Set New Password → Login
```

### Step 1: Request OTP
- User navigates to `/forgot-password`
- Enters their email address
- Clicks "Send OTP"
- OTP is generated and sent to their email

### Step 2: Verify OTP
- User receives 6-digit OTP via email
- Enters OTP on the website
- System verifies OTP validity and expiration
- Upon success, receives a temporary reset token

### Step 3: Reset Password
- User enters new password
- Confirms password
- System validates and updates password
- Redirects to login page

## Technical Implementation

### Backend Architecture

#### File Structure
```
backend/
├── routes/
│   └── auth.js          # Password reset endpoints
├── services/
│   └── emailService.js  # Email sending with Resend
└── .env                 # Configuration
```

#### API Endpoints

##### 1. Send OTP
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@college.edu"
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "If an account exists with this email, an OTP has been sent."
}
```

**Implementation Details:**
- Generates 6-digit random OTP
- Stores OTP in memory with 10-minute expiration
- Sends email via Resend API (or logs to console in dev mode)
- Returns same response regardless of email existence (security)

##### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@college.edu",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "OTP verified successfully"
}
```

**Error Responses:**
- `400` - OTP not found or expired
- `400` - Invalid OTP

##### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newSecurePassword123",
  "email": "user@college.edu"
}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Password has been reset successfully"
}
```

#### OTP Storage

Currently uses in-memory Map for OTP storage:

```javascript
const otpStore = new Map();

// Store OTP
otpStore.set(email, {
  otp: "123456",
  expiresAt: Date.now() + 10 * 60 * 1000,
  userId: user._id
});
```

**Production Recommendation:** Use Redis for distributed systems:
```javascript
await redis.setex(`otp:${email}`, 600, JSON.stringify({
  otp: "123456",
  userId: user._id
}));
```

### Frontend Implementation

#### File Structure
```
frontend/
├── src/
│   ├── pages/
│   │   └── ForgotPassword.jsx  # 3-step password reset UI
│   └── services/
│       └── authService.js      # API integration
```

#### Component State Management

```javascript
const [step, setStep] = useState(1);           // Current step (1-3)
const [email, setEmail] = useState("");        // User email
const [otp, setOtp] = useState("");           // OTP code
const [resetToken, setResetToken] = useState(""); // JWT token
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
```

#### Key Features

**Step 1: Email Input**
- Email validation
- Loading state during OTP send
- Error handling with toast notifications

**Step 2: OTP Input**
- 6-digit numeric input only
- Auto-formatted with `replace(/\D/g, '')`
- Countdown timer display (10 minutes)
- Resend OTP functionality

**Step 3: Password Reset**
- Password visibility toggle
- Password match validation
- Minimum length validation (6 characters)
- Success redirect to login

### Email Service

#### Configuration

The email service uses [Resend](https://resend.com) for reliable email delivery.

**Environment Variables:**
```env
RESEND_API_KEY=re_your_api_key_here
FRONTEND_URL=http://localhost:5173
```

#### Email Template

Beautiful gradient-themed HTML email with:
- College Media branding
- Large OTP display in gradient box
- 10-minute expiration notice
- Security warnings
- Responsive design

**Preview:**
```html
┌─────────────────────────────┐
│   🎓 College Media          │
│   Password Reset Request    │
├─────────────────────────────┤
│                             │
│   Your OTP Code             │
│   ┌──────────────────────┐  │
│   │     123456           │  │
│   └──────────────────────┘  │
│                             │
│   Expires in 10 minutes     │
└─────────────────────────────┘
```

#### Development Mode

When `RESEND_API_KEY` is not configured, the system logs OTP to console:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 PASSWORD RESET OTP (Development Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: user@college.edu
OTP Code: 123456
Expires in: 10 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Configuration

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
npm install resend
```

2. **Environment Variables (.env):**
```env
RESEND_API_KEY=re_your_api_key_here
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
```

3. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (or use test mode)
   - Copy API key from dashboard
   - Add to `.env` file

### Frontend Setup

No additional configuration needed. The frontend automatically uses:
- `VITE_API_URL` for API endpoint (defaults to `http://localhost:5000/api`)

## Testing

### Manual Testing Flow

1. **Start Backend:**
```bash
cd backend
npm start
```

2. **Start Frontend:**
```bash
cd frontend
npm run dev
```

3. **Test Password Reset:**

   **Step 1: Request OTP**
   - Go to `http://localhost:5173/forgot-password`
   - Enter email: `user@college.edu`
   - Click "Send OTP"
   - Check backend console for OTP code

   **Step 2: Verify OTP**
   - Enter the 6-digit OTP from console/email
   - Click "Verify OTP"
   - Should proceed to password reset

   **Step 3: Reset Password**
   - Enter new password (min 6 characters)
   - Confirm password
   - Click "Reset Password"
   - Should redirect to login page

   **Step 4: Verify Reset**
   - Go to `/login`
   - Login with new password
   - Should successfully authenticate

### Testing Scenarios

#### Happy Path
✅ Valid email → OTP sent → Valid OTP → Password reset → Login

#### Error Cases
- ❌ Invalid email format → Validation error
- ❌ Expired OTP (>10 min) → "OTP has expired"
- ❌ Wrong OTP → "Invalid OTP"
- ❌ Passwords don't match → "Passwords don't match"
- ❌ Password too short → "Password must be at least 6 characters"

#### Security Tests
- 🔒 Non-existent email → Same response (no user enumeration)
- 🔒 Expired reset token → "Invalid or expired reset token"
- 🔒 OTP reuse → OTP deleted after password reset

## Security Considerations

### 1. User Enumeration Prevention
```javascript
// Always return success, even if email doesn't exist
res.json({
  success: true,
  message: 'If an account exists with this email, an OTP has been sent.'
});
```

### 2. Time-Limited OTPs
- OTPs expire after 10 minutes
- Reset tokens expire after 15 minutes
- Expired tokens automatically rejected

### 3. OTP Complexity
- 6-digit numeric code = 1,000,000 combinations
- Short validity window limits brute force attacks
- Consider rate limiting in production

### 4. Secure Storage
- OTPs stored with expiration timestamp
- OTPs deleted after successful password reset
- Passwords hashed with bcrypt (10 rounds)

### 5. Token-Based Architecture
- JWT tokens for reset authorization
- Tokens signed with secret key
- Tokens include user ID and email for validation

## Production Recommendations

### 1. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset attempts, please try again later'
});

router.post('/forgot-password', forgotPasswordLimiter, ...);
```

### 2. Redis for OTP Storage
```javascript
const redis = require('redis');
const client = redis.createClient();

// Store OTP
await client.setex(`otp:${email}`, 600, JSON.stringify({
  otp: otp,
  userId: user._id
}));

// Retrieve OTP
const data = await client.get(`otp:${email}`);
```

### 3. Email Domain Verification
```javascript
// Update emailService.js
from: 'College Media <noreply@yourdomain.com>'
```

### 4. Logging and Monitoring
```javascript
// Log password reset attempts
logger.info('Password reset requested', { 
  email, 
  ip: req.ip, 
  timestamp: new Date() 
});
```

### 5. HTTPS Only
Ensure all password reset endpoints use HTTPS in production.

## API Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Invalid OTP or expired token |
| 404 | Endpoint not found |
| 500 | Internal server error |

## Troubleshooting

### Email Not Sending
**Issue:** Resend API error 401
**Solution:** Check `RESEND_API_KEY` in `.env` file

### OTP Not Generated
**Issue:** No console output
**Solution:** Ensure backend server is running and restart if needed

### OTP Expired Too Quickly
**Issue:** OTP expires before user can enter it
**Solution:** Check server time, increase expiration in `auth.js` if needed

### Password Not Updating
**Issue:** Password reset succeeds but login fails
**Solution:** Check database connection, verify `updatePassword` function

## Future Enhancements

- [ ] SMS OTP option for 2FA
- [ ] Account recovery via security questions
- [ ] Password strength meter on reset form
- [ ] Recent login location verification
- [ ] Notification email on successful password change
- [ ] Support for multiple OTP delivery methods
- [ ] Admin panel for password reset audit logs

## Related Documentation

- [Authentication System](./BACKEND_PROPOSAL.md)
- [API Reference](./API_REFERENCE.md)
- [Security Best Practices](./SECURITY.md)

## Support

For issues or questions:
- 📧 Email: support@collegemedia.com
- 💬 Slack: #auth-support
- 🐛 GitHub Issues: [Report Bug](https://github.com/collegemedia/issues)

---

**Last Updated:** January 9, 2026  
**Version:** 1.0.0  
**Author:** College Media Development Team
