# Security Policy

## Overview

This document outlines the security considerations and best practices for the IgniSign Examples repository. **These examples are for demonstration purposes only and should be properly secured before being used in production.**

## Reported Security Issues

### CRITICAL Issues (Fixed)

#### 1. Hardcoded JWT Secret (Fixed)
**Severity**: CRITICAL  
**Status**: ✅ FIXED  
**Location**: `ignisign-node/src/utils/authorization.middleware.ts`

**Issue**: The JWT secret was hardcoded as `'your_secret_key'`, allowing anyone to forge authentication tokens.

**Fix**: 
- JWT secret now **MUST** be set via the `JWT_SECRET` environment variable
- Application will fail to start if `JWT_SECRET` is not configured
- Generate a strong secret using: `openssl rand -base64 32`

**Action Required**: 
- Set `JWT_SECRET` in your `.env` file with a cryptographically secure random value
- Never commit the actual secret to version control

#### 2. Overly Permissive CORS Configuration (Fixed)
**Severity**: CRITICAL  
**Status**: ✅ FIXED  
**Location**: `ignisign-node/src/server.ts`

**Issue**: CORS was configured with `origin: true`, allowing any origin to make credentialed requests to the API. This enabled Cross-Site Request Forgery (CSRF) and other attacks.

**Fix**:
- CORS now validates origins against an allowlist
- Configure allowed origins via `ALLOWED_ORIGINS` environment variable (comma-separated)
- Default: `http://localhost:3456` for development

**Action Required**:
- Set `ALLOWED_ORIGINS` in production to your actual frontend URL(s)
- Example: `ALLOWED_ORIGINS=https://app.example.com,https://app-staging.example.com`

### HIGH Severity Issues (Fixed)

#### 3. Missing Helmet Security Headers (Fixed)
**Severity**: HIGH  
**Status**: ✅ FIXED  
**Location**: `ignisign-node/src/server.ts`

**Issue**: Helmet was installed but not configured, missing critical HTTP security headers.

**Fix**: 
- Helmet middleware now properly configured with:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options
  - X-Content-Type-Options
  - And other security headers

#### 4. Unvalidated File Uploads (Fixed)
**Severity**: HIGH  
**Status**: ✅ FIXED  
**Location**: All upload endpoints

**Issue**: File uploads lacked validation for:
- File type/MIME type
- File size limits
- Malicious file content

**Fix**:
- Created `multer-config.util.ts` with secure upload configuration
- File type validation (PDF, images, documents only)
- Maximum file size: 15MB
- Applied to all upload endpoints

#### 5. Vulnerable Dependencies (Fixed)
**Severity**: HIGH  
**Status**: ✅ FIXED  
**Location**: `ignisign-js/package.json`, `ignisign-node/package.json`

**Issue**: Multiple vulnerable dependencies with known CVEs:
- axios@0.21.1 has CVE-2021-3749 (Regular expression denial of service)
- express@4.17.3 has CVE-2022-24999 (Open redirect in res.location/res.redirect)
- lodash@4.17.20 has prototype pollution vulnerabilities
- dotenv@8.2.0 is significantly outdated (5+ years old)

**Fix**: 
- Updated axios to ^1.20.0 (latest)
- Updated express from 4.17.3 to ^4.21.2 (fixes CVE-2022-24999 and other vulnerabilities)
- Updated lodash from 4.17.20 to ^4.18.1 (fixes prototype pollution)
- Updated dotenv from 8.2.0 to ^16.4.7 (latest stable)
- Updated helmet from 3.22.0 to ^8.3.0 with v8 API compatibility
- Updated cors from 2.8.5 to ^2.8.6
- Updated jsonwebtoken from 9.0.2 to ^9.0.3

**Action Required**: Run `npm install` after merging to install updated dependencies

### MEDIUM Severity Issues (Fixed)

#### 6. Open Redirect Vulnerability (Fixed)
**Severity**: MEDIUM  
**Status**: ✅ FIXED  
**Location**: `ignisign-js/src/pages/contracts.page.tsx`

**Issue**: `window.open()` used with unsanitized URLs, potentially allowing open redirect attacks.

**Fix**:
- Created `url-validation.ts` utility for safe URL handling
- URLs now validated against allowed domains before opening
- Dangerous protocols (javascript:, data:, etc.) are blocked
- `window.opener` is cleared to prevent reverse tabnabbing

#### 7. Sensitive Token Logging (Fixed)
**Severity**: MEDIUM  
**Status**: ✅ FIXED  
**Location**: `ignisign-node/src/services/oauth.service.ts`, `ignisign-node/src/services/example/bare-signature.service.ts`

**Issue**: Access tokens, refresh tokens, authorization codes, and code verifiers were being logged to console, potentially exposing them in production logs.

**Fix**:
- Token values now redacted in all log statements
- Logs show `[REDACTED]` instead of actual token values
- Prevents information disclosure via log files

**Found**: 2026-09-21 weekly security re-scan

## Historical Security Issues

### Previously Committed Secrets (Requires Rotation)

**Severity**: CRITICAL  
**Status**: ⚠️ REQUIRES ACTION  
**Commit**: `2eae49dcf4f242321b6c1fcfb73c19b2c900a59a` (Sep 15, 2023)

A `.env` file containing real API credentials was committed and later deleted:

```
IGNISIGN_APP_ID=[REDACTED]
IGNISIGN_APP_ENV=DEVELOPMENT
IGNISIGN_APP_SECRET=sk_development_[REDACTED]
```

**⚠️ REQUIRED ACTIONS:**

1. **IMMEDIATELY ROTATE** the exposed API credentials:
   - Log into the IgniSign Console
   - Navigate to the application: `[REDACTED]`
   - Generate new API keys
   - Update all systems using the old credentials

2. **AUDIT ACCESS**: Review IgniSign logs for any unauthorized access using these credentials between September 2023 and the rotation date

3. **GIT HISTORY CONSIDERATIONS**: 
   - The secret remains in git history permanently
   - Rotation is the only mitigation
   - Consider using tools like `git-filter-repo` or `BFG Repo-Cleaner` for internal forks, but the public GitHub history cannot be changed

## Recent Security Audits

### 2026-10-04 Weekly Audit

**New Findings:**
- **Express 4.17.3 → 4.21.2**: Fixed CVE-2022-24999 (open redirect) and multiple other security issues
- **Lodash 4.17.20 → 4.18.1**: Fixed prototype pollution vulnerabilities  
- **Dotenv 8.2.0 → 16.4.7**: Updated from 2019 version to current release (2024)

**Status:** All HIGH severity issues addressed. No CRITICAL issues found.

**Note:** Dependabot is currently disabled on this repository. Enable it in repository settings for automated dependency security alerts.

### 2026-09-28 Weekly Audit

**Findings:**
- Updated axios from 1.6.x to 1.20.0
- Updated helmet from 3.22.0 to 8.3.0 with v8 API
- Updated cors and jsonwebtoken
- Extended token logging redaction to frontend

**Status:** All security patches applied successfully.

### 2026-09-21 Weekly Audit  

**Findings:**
- Token logging information disclosure in backend OAuth service
- Fixed by redacting all token values in logs

## Security Best Practices

### For Development

1. **Never commit secrets**:
   - Use `.env` files (already in `.gitignore`)
   - Use `.env.example` for templates only
   - Double-check commits before pushing

2. **Use separate credentials**:
   - Development credentials for local development
   - Staging credentials for staging environments
   - Production credentials for production (never use in examples)

3. **Regular dependency updates**:
   ```bash
   npm audit
   npm audit fix
   ```

### For Production Deployment

1. **Environment Variables**:
   - Set all secrets via environment variables
   - Never hardcode secrets in source code
   - Use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)

2. **Required Environment Variables**:
   ```bash
   # Backend (ignisign-node)
   JWT_SECRET=<strong-random-secret>          # REQUIRED
   ALLOWED_ORIGINS=https://your-app.com       # REQUIRED
   IGNISIGN_API_KEY=skv2_...                  # REQUIRED
   
   # Optional but recommended
   NODE_ENV=production
   ```

3. **Additional Security Measures**:
   - Use HTTPS everywhere
   - Implement rate limiting
   - Add request logging and monitoring
   - Use a Web Application Firewall (WAF)
   - Regular security audits
   - Keep dependencies updated

4. **CORS Configuration**:
   - Never use `origin: true` in production
   - Explicitly list allowed origins
   - Use environment-specific configuration

5. **File Uploads**:
   - Scan uploaded files for malware
   - Store uploads outside the web root
   - Use cloud storage (S3, Azure Blob) in production
   - Implement virus scanning

## Reporting Security Issues

If you discover a security vulnerability in this repository:

1. **DO NOT** open a public issue
2. Email security concerns to: [security@ignisign.io]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Checklist for Production Use

- [ ] All secrets moved to environment variables
- [ ] Strong `JWT_SECRET` configured (min 32 bytes random)
- [ ] `ALLOWED_ORIGINS` set to actual frontend URLs only
- [ ] HTTPS enabled everywhere
- [ ] Dependencies updated and audited (`npm audit`)
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] File upload scanning enabled
- [ ] Logging and monitoring configured
- [ ] Security headers verified (use securityheaders.com)
- [ ] API credentials rotated (if using this repo's history)
- [ ] Regular security updates scheduled

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [IgniSign Security Documentation](https://docs.ignisign.io)

---

**Last Updated**: 2026-09-15  
**Version**: 1.0
