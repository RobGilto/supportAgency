# Security

Since this is a local-first browser application, security focuses on client-side protection, data privacy, and secure integrations.

## Input Validation
- **Validation Library:** Zod for runtime schema validation
- **Validation Location:** At service layer before database operations
- **Required Rules:**
  - All external inputs MUST be validated
  - Validation at service boundary before processing
  - Whitelist approach preferred over blacklist
  - **ID Format Validation:**
    - Salesforce case numbers: 8-digit format (e.g., "05907169")
    - JIRA Engineering tickets: "DOMO-XXXXXX" format (e.g., "DOMO-456837")
    - JIRA Hivemind tickets: "HIVE-XXXX" format (e.g., "HIVE-2263")

```typescript
// ID validation schemas
const IDValidationSchemas = {
  salesforceCase: z.string().regex(/^\d{8}$/, "Must be 8-digit number"),
  jiraEngineering: z.string().regex(/^DOMO-\d{6}$/, "Must be DOMO-XXXXXX format"),
  jiraHivemind: z.string().regex(/^HIVE-\d{4}$/, "Must be HIVE-XXXX format")
};

const CaseInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  salesforceNumber: IDValidationSchemas.salesforceCase.optional(),
  jiraTickets: z.array(z.union([
    IDValidationSchemas.jiraEngineering,
    IDValidationSchemas.jiraHivemind
  ])).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  classification: z.enum(['error', 'query', 'feature_request'])
});
```

## Authentication & Authorization
- **Auth Method:** Browser-based session management with optional local authentication
- **Session Management:** Browser storage with encrypted sensitive data
- **Required Patterns:**
  - Optional user profiles stored locally
  - Data isolation between different browser profiles
  - No server-side authentication required

## Secrets Management
- **Development:** Environment variables for API keys (if any)
- **Production:** No secrets required for core functionality
- **Code Requirements:**
  - NEVER hardcode any API tokens or keys
  - Domo LLM access via user's existing session only
  - No secrets in logs or error messages
  - External API tokens encrypted in IndexedDB if stored

## API Security
- **Rate Limiting:** Browser-based request throttling for external APIs
- **CORS Policy:** Handled by browser security model
- **Security Headers:** Configured in hosting/Docker setup
- **HTTPS Enforcement:** Required for production deployment

## Data Protection
- **Encryption at Rest:** IndexedDB with optional client-side encryption for sensitive fields
- **Encryption in Transit:** HTTPS for all external communications
- **PII Handling:** Only first names stored, no sensitive customer data
- **Logging Restrictions:** Never log case numbers, customer data, or sensitive information

```typescript
// Data sanitization for logs
function sanitizeForLogging(data: any): any {
  const sensitive = ['salesforceNumber', 'email', 'phone', 'customerId'];
  const sanitized = { ...data };
  
  sensitive.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
```

## Dependency Security
- **Scanning Tool:** npm audit for dependency vulnerabilities
- **Update Policy:** Monthly security updates for critical vulnerabilities
- **Approval Process:** Review all new dependencies for security implications

## Security Testing
- **SAST Tool:** ESLint security rules for static analysis
- **DAST Tool:** Manual security testing checklist
- **Penetration Testing:** Annual security review of client-side code

## Browser Security Features
- **Content Security Policy:** Strict CSP headers to prevent XSS
- **Same-Origin Policy:** Leverage browser security model
- **Secure Context:** Require HTTPS for production features
- **Storage Security:** Use IndexedDB encryption for sensitive data

```typescript
// Secure storage wrapper
class SecureStorage {
  private encryptionKey: CryptoKey | null = null;
  
  async initialize() {
    // Generate or retrieve encryption key
    this.encryptionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encryptData(data: string): Promise<ArrayBuffer> {
    if (!this.encryptionKey) throw new Error('Storage not initialized');
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBuffer
    );
    
    return encrypted;
  }
}
```

## Image Security
- **File Validation:** Strict image format validation before processing
- **Size Limits:** Maximum 10MB per image file
- **Format Restriction:** Only allow common image formats (PNG, JPG, GIF, WebP)
- **Processing Security:** Sanitize image metadata during WebP conversion

```typescript
async function validateImageFile(file: File): Promise<Result<File, SecurityError>> {
  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: new SecurityError('Invalid file type', { type: file.type })
    };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      success: false,
      error: new SecurityError('File too large', { size: file.size })
    };
  }
  
  return { success: true, data: file };
}
```

## External Integration Security
- **Domo LLM:** Manual copy/paste workflow maintains air-gap security
- **Salesforce/JIRA URLs:** Validation of URL format before display
- **No API Keys:** No stored credentials for external services

## Case Number Security
- **Format Validation:** Ensure case numbers match 8-digit pattern
- **Uniqueness:** Prevent duplicate case numbers in local storage
- **Display Security:** Mask case numbers in logs and error messages

```typescript
// Case number validation and generation
function validateCaseNumber(caseNumber: string): boolean {
  return /^\d{8}$/.test(caseNumber);
}

function generateCaseNumber(): string {
  // Generate 8-digit case number (example algorithm)
  const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `059${timestamp}${random}`.slice(-8); // Ensure 8 digits
}
```

## Security Monitoring
- **Client-Side Monitoring:** Browser security events and errors
- **Storage Monitoring:** IndexedDB quota usage and security events
- **Error Tracking:** Security-focused error logging

## Privacy Compliance
- **Data Minimization:** Only store necessary data locally
- **User Control:** Users can export/delete all their data
- **No Tracking:** No analytics or tracking without user consent
- **Local-First:** All data remains on user's device

## Rationale for browser-focused security:
- **No Server Attack Surface:** Eliminates most common web vulnerabilities
- **User-Controlled Data:** Users maintain full control over their information
- **Browser Security Model:** Leverages built-in browser security features
- **Encryption Options:** Client-side encryption for sensitive data
- **Privacy by Design:** Minimal data collection and storage
- **Audit Trail:** All operations logged locally for security monitoring