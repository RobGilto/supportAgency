# Data Models

Based on the Smart Support Agent Application requirements, here are the core data models that will be stored in IndexedDB:

## Case
**Purpose:** Central entity representing a support case from creation to resolution

**Key Attributes:**
- id: string (UUID) - Unique case identifier
- caseNumber: string - 8-digit case number (e.g., "05907169")
- title: string - Brief case description
- description: string - Detailed case information
- status: enum - pending | in_progress | resolved | closed
- priority: enum - low | medium | high | critical
- classification: enum - error | query | feature_request
- createdAt: timestamp - Case creation time
- updatedAt: timestamp - Last modification time
- createdBy: string - Agent who created the case
- assignedTo: string - Currently assigned agent
- customerId: string - Reference to customer
- salesforceNumber: string - 8-digit Salesforce case number
- jiraTickets: string[] - JIRA ticket references (DOMO-456837, HIVE-2263 formats)
- tags: string[] - Categorization tags
- artifacts: string[] - References to attached files
- inboxItems: string[] - Related inbox items

**Relationships:**
- Has many CaseEvents (history/audit trail)
- Has many CaseArtifacts (attachments)
- Belongs to Customer
- Has many InboxItems

## Customer
**Purpose:** Maintain customer relationships and interaction history (privacy-compliant)

**Key Attributes:**
- id: string (UUID) - Unique identifier
- firstName: string - First name only (privacy)
- companyName: string - Organization name
- relationshipScore: number - Interaction quality metric
- firstContactDate: timestamp - Initial interaction
- lastContactDate: timestamp - Most recent interaction
- communicationPreferences: object - Preferred contact methods
- notes: string - Agent notes about customer
- tags: string[] - Customer categorization

**Relationships:**
- Has many Cases
- Has many InteractionLogs

## InboxItem
**Purpose:** Raw content items that can be processed into cases or attached to existing cases

**Key Attributes:**
- id: string (UUID) - Unique identifier
- type: enum - text | url | image | console_log | email
- content: string - Raw content or reference
- metadata: object - Type-specific metadata
- processed: boolean - Processing status
- processedAt: timestamp - When processed
- caseId: string? - Linked case if processed
- priority: enum - low | medium | high
- createdAt: timestamp - Creation time
- source: string - Origin of item
- tags: string[] - Auto-generated tags

**Relationships:**
- May belong to Case
- Has ProcessingResult

## CaseArtifact
**Purpose:** Files and processed content attached to cases

**Key Attributes:**
- id: string (UUID) - Unique identifier
- caseId: string - Parent case
- type: enum - image | document | log | screenshot
- fileName: string - Original file name
- mimeType: string - File MIME type
- size: number - File size in bytes
- content: Blob - Actual file content
- annotations: object? - Image annotations data
- metadata: object - Extracted metadata
- createdAt: timestamp - Upload time
- createdBy: string - Uploading agent

**Relationships:**
- Belongs to Case
- May have Annotations

## HivemindReport
**Purpose:** Structured reports for internal compliance and product meetings

**Key Attributes:**
- id: string (UUID) - Unique identifier
- caseId: string - Source case
- title: string - Concise issue summary
- component: enum - Connect|Content|Data Transformation|Developer|Domo Everywhere|Governance|Legacy|Mobile|Other
- subComponent: string - Based on component selection
- description: string - Detailed explanation (>200 chars)
- troubleshootingDone: object - Steps performed, KB articles used, test environments
- stepsToReproduce: string[] - Numbered reproduction steps
- urls: string[] - Related URLs
- engineeringInfo: object - Error messages, logs, Client TOE
- status: enum - draft | pending_review | submitted
- llmPrompt: string? - Generated prompt for LLM
- llmResponse: string? - LLM response
- parsedData: object? - Parsed response
- validationResults: object? - Validation checks
- iterationHistory: object[] - Questions/responses during LLM interaction
- questionsAsked: string[] - All questions asked during process
- userResponses: object[] - All user responses with timestamps
- iterationCount: number - Number of back-and-forth cycles
- satisfactionConfirmed: boolean - LLM confirmed data completeness
- finalValidation: object - Final validation results
- createdAt: timestamp - Creation time
- submittedAt: timestamp? - Submission time

**Relationships:**
- Belongs to Case
- Has ValidationResults

## ImageGallery
**Purpose:** Store WebP images with annotations in carousel interface

**Key Attributes:**
- id: string (UUID) - Unique identifier
- caseId: string? - Optional case association
- webpData: blob - WebP image data
- originalFormat: string - Original format (png, jpg, etc.)
- thumbnailData: blob - Small WebP thumbnail
- width: number - Image width
- height: number - Image height
- fileSize: number - File size in bytes
- tags: string[] - Image categorization
- uploadedAt: timestamp - Upload time
- lastAnnotated: timestamp? - Last annotation time

**Relationships:**
- Has many ImageAnnotations
- May belong to Case

## ImageAnnotations
**Purpose:** CRUD annotations on images (red/green highlights, arrows, text)

**Key Attributes:**
- id: string (UUID) - Unique identifier
- imageId: string - Parent image
- type: enum - highlight_red | highlight_green | arrow | text
- data: object - Position, size, text content
- layer: number - Layer order for rendering
- style: object - Color, font size, line width
- createdAt: timestamp - Creation time
- updatedAt: timestamp - Last modification

**Relationships:**
- Belongs to ImageGallery

## Pattern
**Purpose:** Store identified patterns and rules for case matching

**Key Attributes:**
- id: string (UUID) - Unique identifier
- name: string - Pattern name
- description: string - What this pattern identifies
- type: enum - keyword | regex | similarity | rule
- pattern: string - Pattern definition
- category: string - Pattern category
- matchCount: number - Times matched
- successRate: number - Resolution success rate
- suggestedActions: string[] - Recommended actions
- active: boolean - Is pattern active
- createdAt: timestamp - Creation time
- updatedAt: timestamp - Last update

**Relationships:**
- Has many PatternMatches
- Has SuggestedResolutions

## AgentSettings
**Purpose:** Store user preferences and application settings

**Key Attributes:**
- id: string - Agent identifier
- theme: enum - light | dark | system
- defaultPriority: enum - Default case priority
- autoProcessInbox: boolean - Auto-process settings
- notificationPreferences: object - Alert settings
- keyboardShortcuts: object - Custom shortcuts
- savedSearches: object[] - Frequent searches
- dashboardLayout: object - UI customization
- cliHistory: string[] - Command history
- cliAliases: object - Custom commands

**Relationships:**
- Belongs to Agent/User

## InformationRequests
**Purpose:** Track requests for missing client information

**Key Attributes:**
- id: string (UUID) - Unique identifier
- caseId: string - Related case
- missingFields: string[] - What information is needed
- requestPrompt: string - Generated instruction text
- sentAt: timestamp - When request was sent
- clientResponse: string? - Client's response
- responseReceived: timestamp? - When response received
- status: enum - sent | responded | completed

**Relationships:**
- Belongs to Case