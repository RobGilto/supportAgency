# Database Schema

Since we're using IndexedDB (via Dexie.js) for browser-based storage, here are the schema definitions:

```javascript
// Dexie Schema Definition
const db = new Dexie('SupportAgencyDB');

db.version(1).stores({
  // Case Management
  cases: '++id, caseNumber, status, priority, classification, customerId, createdAt, updatedAt, *tags',
  
  // Customer Relationships
  customers: '++id, firstName, companyName, firstContactDate, lastContactDate',
  
  // Inbox for processing
  inboxItems: '++id, type, processed, caseId, priority, createdAt, source, *tags',
  
  // Case artifacts with WebP images
  caseArtifacts: '++id, caseId, type, fileName, createdAt, createdBy',
  
  // Image Gallery
  imageGallery: '++id, caseId, uploadedAt, *tags',
  imageAnnotations: '++id, imageId, type, data, createdAt, updatedAt',
  
  // Hivemind Reports with iterative LLM process
  hivemindReports: '++id, caseId, status, createdAt, submittedAt, component, subComponent',
  
  // Pattern matching
  patterns: '++id, name, type, category, active, matchCount',
  patternMatches: '++id, patternId, caseId, matchedAt',
  
  // Agent settings
  agentSettings: 'id, theme, *savedSearches',
  
  // CLI history
  cliHistory: '++id, command, executedAt',
  
  // Case events for audit trail
  caseEvents: '++id, caseId, eventType, timestamp, agentId',
  
  // Search index
  searchIndex: 'id, type, content, *keywords',
  
  // Information requests
  informationRequests: '++id, caseId, sentAt, status'
});

// IndexedDB Schema with detailed field definitions
const schemas = {
  cases: {
    id: 'string', // UUID
    caseNumber: 'string', // 8-digit format (e.g., "05907169")
    title: 'string',
    description: 'string',
    status: 'enum:pending|in_progress|resolved|closed',
    priority: 'enum:low|medium|high|critical',
    classification: 'enum:error|query|feature_request',
    customerId: 'string?',
    assignedTo: 'string?',
    salesforceNumber: 'string?', // 8-digit format (e.g., "05907703")
    jiraTickets: 'string[]', // ["HIVE-2263", "DOMO-456837"] formats
    tags: 'string[]',
    artifacts: 'string[]',
    inboxItems: 'string[]',
    createdAt: 'timestamp',
    updatedAt: 'timestamp',
    createdBy: 'string'
  },
  
  hivemindReports: {
    id: 'string', // UUID
    caseId: 'string',
    title: 'string', // Concise issue summary
    component: 'enum:Connect|Content|Data Transformation|Developer|Domo Everywhere|Governance|Legacy|Mobile|Other',
    subComponent: 'string', // Based on component selection
    description: 'string', // >200 chars required
    troubleshootingDone: 'object', // {steps: [], kbArticles: [], testEnvironments: []}
    stepsToReproduce: 'string[]', // Numbered steps
    urls: 'string[]', // Full https:// URLs
    engineeringInfo: 'object', // {errorMessages: [], logs: [], clientTOE: {}}
    status: 'enum:draft|pending_review|submitted',
    llmPrompt: 'string?', // Generated prompt
    llmResponse: 'string?', // Raw LLM response
    parsedData: 'object?', // Parsed response
    validationResults: 'object?', // Validation checks
    iterationHistory: 'object[]', // [{step: 1, questions: [], responses: [], timestamp}]
    questionsAsked: 'string[]', // All questions asked during process
    userResponses: 'object[]', // All user responses with timestamps
    iterationCount: 'number', // Number of back-and-forth cycles
    satisfactionConfirmed: 'boolean', // LLM confirmed data completeness
    finalValidation: 'object', // Final validation results
    createdAt: 'timestamp',
    submittedAt: 'timestamp?'
  },
  
  imageGallery: {
    id: 'string', // UUID
    caseId: 'string?', // Optional case association
    webpData: 'blob', // WebP image data
    originalFormat: 'string', // png, jpg, etc.
    thumbnailData: 'blob', // Small WebP thumbnail
    width: 'number',
    height: 'number',
    fileSize: 'number',
    tags: 'string[]',
    uploadedAt: 'timestamp',
    lastAnnotated: 'timestamp?'
  },
  
  imageAnnotations: {
    id: 'string', // UUID
    imageId: 'string',
    type: 'enum:highlight_red|highlight_green|arrow|text',
    data: 'object', // {x, y, width, height, text?, startPoint?, endPoint?}
    layer: 'number', // Layer order
    style: 'object', // {color, fontSize, lineWidth, etc.}
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  
  informationRequests: {
    id: 'string', // UUID
    caseId: 'string',
    missingFields: 'string[]', // ['clientTOE', 'datasetURL', 'screenshots']
    requestPrompt: 'string', // Generated instruction text
    sentAt: 'timestamp',
    clientResponse: 'string?',
    responseReceived: 'timestamp?',
    status: 'enum:sent|responded|completed'
  }
};
```

## Key Schema Design Decisions:

1. **Hivemind Structure**: Directly maps to your prompt template with component/subComponent enums
2. **Image Storage**: WebP blobs stored directly in IndexedDB with thumbnail generation
3. **Annotation Layers**: Separate table for CRUD operations on annotations
4. **JIRA/Salesforce**: Simple string fields that get formatted as URLs in the UI
5. **Search Optimization**: Compound indexes on frequently queried fields
6. **Audit Trail**: CaseEvents table tracks all changes
7. **Blob Storage**: Images and files stored as blobs in IndexedDB

## Storage Considerations:
- IndexedDB has generous storage limits (typically 50% of free disk space)
- WebP format reduces image size by 25-35% compared to JPEG
- Thumbnails enable fast gallery rendering
- Indexes optimize common queries like status filtering