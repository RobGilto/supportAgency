// Core data models for Smart Support Agent Application

export interface Case {
  id: string; // UUID
  caseNumber: string; // 8-digit format (e.g., "05907169")
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  classification: CaseClassification;
  customerId?: string;
  customerName?: string;
  salesforceCaseNumber?: string; // 8-digit format
  jiraTicket?: string; // DOMO-XXXXXX or HIVE-XXXX format
  tags: string[];
  artifacts: string[]; // Array of artifact IDs
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface Customer {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  relationshipStrength: RelationshipStrength;
  notes?: string;
}

export interface InboxItem {
  id: string; // UUID
  content: string;
  contentType: ContentType;
  source: InboxSource;
  pasteIntent: PasteIntent;
  confidence: number; // 0-1 confidence score
  createdAt: Date;
  processedAt?: Date;
  caseId?: string; // If converted to case
  metadata: Record<string, any>;
}

export interface Artifact {
  id: string; // UUID
  caseId: string;
  filename: string;
  fileType: string;
  mimeType: string;
  size: number;
  content: Blob;
  createdAt: Date;
  description?: string;
  tags: string[];
}

export interface ImageGallery {
  id: string; // UUID
  filename: string;
  originalFormat: string;
  webpBlob: Blob;
  thumbnailBlob: Blob;
  width: number;
  height: number;
  fileSize: number;
  caseId?: string;
  createdAt: Date;
  tags: string[];
  annotations?: AnnotationData[];
}

export interface AnnotationData {
  id: string; // UUID
  type: AnnotationType;
  coordinates: Point[];
  text?: string;
  color: string;
  layerId: string;
  createdAt: Date;
}

export interface HivemindReport {
  id: string; // UUID
  caseId: string;
  title: string;
  description: string;
  components: string[];
  subComponents: string[];
  troubleshootingSteps: string[];
  caseUrls: string[];
  engineeringInfo: string;
  preChecks: HivemindPreCheck[];
  completenessScore: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

export interface HivemindPreCheck {
  id: string;
  name: string;
  checked: boolean;
  description: string;
}

export interface SearchIndex {
  id: string; // UUID
  entityId: string; // ID of the indexed entity
  entityType: SearchEntityType;
  content: string; // Full-text content to search
  title: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedSearch {
  id: string; // UUID
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export interface UserSettings {
  id: string;
  theme: Theme;
  language: string;
  timezone: string;
  displayPreferences: DisplayPreferences;
  searchPreferences: SearchPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseHistory {
  id: string; // UUID
  caseId: string;
  action: HistoryAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  timestamp: Date;
  notes?: string;
}

export interface ContentPattern {
  id: string; // UUID
  pattern: string;
  patternType: PatternType;
  category: CaseClassification;
  confidence: number;
  examples: string[];
  createdAt: Date;
  successRate: number;
}

export interface Analytics {
  id: string; // UUID
  metricType: MetricType;
  value: number;
  dimensions: Record<string, string>;
  timestamp: Date;
  period: AnalyticsPeriod;
}

export interface CommandHistory {
  id: string; // UUID
  command: string;
  args: string[];
  output: string;
  success: boolean;
  executedAt: Date;
  executionTime: number;
}

// Enums and Types
export type CaseStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CaseClassification = 'error' | 'query' | 'feature_request';
export type ContentType = 'text' | 'url' | 'image' | 'console_log' | 'mixed';
export type InboxSource = 'paste' | 'upload' | 'manual';
export type PasteIntent = 'create_case' | 'add_to_inbox' | 'analyze' | 'unknown';
export type RelationshipStrength = 'cold' | 'warm' | 'hot' | 'champion';
export type AnnotationType = 'highlight_red' | 'highlight_green' | 'arrow' | 'text';
export type SearchEntityType = 'case' | 'customer' | 'inbox_item' | 'hivemind_report';
export type Theme = 'light' | 'dark' | 'auto';
export type HistoryAction = 'created' | 'updated' | 'status_changed' | 'assigned' | 'resolved' | 'closed';
export type PatternType = 'keyword' | 'regex' | 'semantic';
export type MetricType = 'case_count' | 'resolution_time' | 'customer_satisfaction' | 'tag_usage';
export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

// Utility Types
export interface Point {
  x: number;
  y: number;
}

export interface SearchFilters {
  status?: CaseStatus[];
  priority?: CasePriority[];
  classification?: CaseClassification[];
  dateRange?: DateRange;
  tags?: string[];
  customerId?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DisplayPreferences {
  caseListPageSize: number;
  showThumbnails: boolean;
  compactView: boolean;
  defaultSort: string;
}

export interface SearchPreferences {
  includeClosedCases: boolean;
  searchHistory: boolean;
  autoComplete: boolean;
  maxResults: number;
}

// Settings Management Types for Story 4
export interface AppSettings {
  theme: Theme;
  terminalVisible: boolean;
  terminalHeight: number;
  sidebarCollapsed: boolean;
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  caseUpdates: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReporting: boolean;
  usageStatistics: boolean;
}

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
  warning: boolean;
  critical: boolean;
}

export interface DataExport {
  version: string;
  timestamp: Date;
  settings: AppSettings;
  cases: Case[];
  customers: Customer[];
  inboxItems: InboxItem[];
  savedSearches: SavedSearch[];
  imageGallery: Omit<ImageGallery, 'webpBlob' | 'thumbnailBlob'>[]; // Exclude blobs for JSON
}

export interface DataCleanupOptions {
  clearCases: boolean;
  clearCustomers: boolean;
  clearInboxItems: boolean;
  clearImages: boolean;
  clearSearchHistory: boolean;
  keepSettings: boolean;
  confirmationRequired: boolean;
}

// Content Processing Types for Story 5
export interface PasteEvent {
  id: string;
  content: string;
  contentType: DetectedContentType;
  timestamp: Date;
  source: 'clipboard' | 'drag-drop' | 'file-upload';
  confidence: number; // 0-1 confidence score
  suggestedActions: PasteAction[];
  metadata: PasteMetadata;
}

export interface PasteAction {
  id: string;
  type: PasteActionType;
  label: string;
  description: string;
  confidence: number;
  data?: Record<string, any>;
}

export interface PasteMetadata {
  urls?: string[];
  images?: ImageInfo[];
  consoleErrors?: ConsoleLogEntry[];
  technicalDetails?: TechnicalInfo;
  customerInfo?: CustomerInfo;
  urgencyLevel?: UrgencyLevel;
  caseNumbers?: string[];
  patternMatches?: PatternMatchInfo[];
  similarCases?: SimilarCaseInfo[];
  duplicateContent?: boolean;
}

export interface ImageInfo {
  dataUrl: string;
  format: string;
  size: number;
  dimensions: { width: number; height: number };
}

export interface ConsoleLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp?: Date;
  source?: string;
  stackTrace?: string;
}

export interface TechnicalInfo {
  browser?: string;
  os?: string;
  clientToe?: string;
  errorMessages?: string[];
  stackTraces?: string[];
}

export interface CustomerInfo {
  name?: string;
  email?: string;
  company?: string;
  detectionConfidence: number;
}

export interface PatternMatchInfo {
  pattern: string;
  confidence: number;
  matchType: 'exact' | 'partial' | 'semantic';
}

export interface SimilarCaseInfo {
  caseId: string;
  caseNumber: string;
  similarity: number;
  title: string;
}

export interface ContentAnalysisResult {
  contentType: DetectedContentType;
  confidence: number;
  classification: CaseClassification;
  priority: CasePriority;
  suggestedTitle?: string;
  extractedData: PasteMetadata;
  processingTime: number;
}

// New types for content processing
export type DetectedContentType = 'support_request' | 'url_link' | 'console_log' | 'image' | 'mixed_content' | 'plain_text' | 'case_number';
export type PasteActionType = 'create_case' | 'add_to_inbox' | 'extract_url' | 'process_image' | 'analyze_logs' | 'save_for_later' | 'lookup_case';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

// Result Pattern for Error Handling
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Database Error Types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public entityType?: string, public id?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}