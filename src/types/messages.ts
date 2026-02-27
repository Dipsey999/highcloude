// ========================================
// UI → Code Messages
// ========================================
export type UIMessage =
  | { type: 'SAVE_CREDENTIALS'; payload: CredentialPayload }
  | { type: 'LOAD_CREDENTIALS' }
  | { type: 'CLEAR_CREDENTIALS' }
  | { type: 'EXTRACT_TOKENS' }
  | { type: 'GET_SELECTION' }
  | { type: 'APPLY_TOKENS'; instructions: VariableUpdateInstruction[] }
  | { type: 'CREATE_DESIGN'; spec: DesignSpecNode }
  | { type: 'EXPORT_SELECTION' }
  | { type: 'AUTO_MAP_TOKENS' }
  | { type: 'APPLY_TOKEN_BINDINGS'; bindings: TokenBindingInstruction[] }
  // Phase 6: Token Browser
  | { type: 'GET_TOKEN_USAGE'; variableId: string }
  | { type: 'UPDATE_TOKEN_VALUE'; variableId: string; modeId: string; newValue: string | number | boolean }
  | { type: 'GET_VARIABLE_MODES'; collectionId: string }
  // Phase 6: Sync History
  | { type: 'LOAD_SYNC_HISTORY' }
  | { type: 'SAVE_SYNC_ENTRY'; entry: SyncHistoryEntry }
  | { type: 'REVERT_TO_SYNC'; entryId: string }
  | { type: 'CLEAR_SYNC_HISTORY' }
  // Phase 6: Batch Operations
  | { type: 'BATCH_AUTO_MAP_ALL_PAGES' }
  | { type: 'VALIDATE_TOKENS_DTCG' }
  | { type: 'FIND_UNUSED_TOKENS' }
  | { type: 'FIND_ORPHANED_VALUES'; pageIds?: string[] }
  // Phase 7: Multi-File & Team Sync
  | { type: 'SAVE_SYNC_CONFIG'; config: SyncConfig }
  | { type: 'LOAD_SYNC_CONFIG' }
  // Phase 8: Web Bridge
  | { type: 'SAVE_BRIDGE_TOKEN'; token: string }
  | { type: 'LOAD_BRIDGE_TOKEN' }
  | { type: 'CLEAR_BRIDGE_TOKEN' }
  | { type: 'FETCH_BRIDGE_CONFIG'; bridgeToken: string }
  | { type: 'FETCH_BRIDGE_KEYS'; bridgeToken: string }
  // Component Pattern Library
  | { type: 'SAVE_COMPONENT_PATTERN'; pattern: ComponentPatternInput }
  | { type: 'LIST_COMPONENT_PATTERNS' }
  | { type: 'DELETE_COMPONENT_PATTERN'; patternId: string }
  | { type: 'EXPORT_SELECTION_AS_PATTERN' };

export interface CredentialPayload {
  claudeApiKey?: string;
  githubToken: string;
  githubRepo?: string;
  githubBranch?: string;
  githubFilePath?: string;
}

// ========================================
// Code → UI Messages
// ========================================
export type CodeMessage =
  | { type: 'CREDENTIALS_LOADED'; payload: CredentialPayload | null }
  | { type: 'CREDENTIALS_SAVED' }
  | { type: 'CREDENTIALS_CLEARED' }
  | { type: 'TOKENS_EXTRACTED'; data: RawExtractionResult }
  | { type: 'EXTRACTION_PROGRESS'; stage: string; percent: number }
  | { type: 'SELECTION_DATA'; data: SelectionExport }
  | { type: 'ERROR'; message: string }
  | { type: 'TOKENS_APPLIED'; result: ApplyTokensResult }
  | { type: 'APPLY_PROGRESS'; stage: string; percent: number }
  | { type: 'DESIGN_CREATED'; result: CreateDesignResult }
  | { type: 'DESIGN_CREATION_PROGRESS'; stage: string; percent: number }
  | { type: 'SELECTION_EXPORTED'; result: SelectionExportResult }
  | { type: 'EXPORT_PROGRESS'; stage: string; percent: number }
  | { type: 'AUTO_MAP_RESULT'; result: AutoMapResult }
  | { type: 'AUTO_MAP_PROGRESS'; stage: string; percent: number }
  | { type: 'BINDINGS_APPLIED'; result: ApplyBindingsResult }
  // Phase 6: Token Browser
  | { type: 'TOKEN_USAGE_RESULT'; variableId: string; count: number; nodeNames: string[] }
  | { type: 'TOKEN_VALUE_UPDATED'; variableId: string; success: boolean; error?: string }
  | { type: 'VARIABLE_MODES_RESULT'; collectionId: string; modes: Array<{ modeId: string; modeName: string }> }
  // Phase 6: Sync History
  | { type: 'SYNC_HISTORY_LOADED'; entries: SyncHistoryEntry[] }
  | { type: 'SYNC_ENTRY_SAVED' }
  | { type: 'REVERT_COMPLETE'; result: ApplyTokensResult }
  | { type: 'SYNC_HISTORY_CLEARED' }
  // Phase 6: Batch Operations
  | { type: 'BATCH_AUTO_MAP_ALL_RESULT'; result: AutoMapResult }
  | { type: 'BATCH_AUTO_MAP_ALL_PROGRESS'; stage: string; percent: number }
  | { type: 'DTCG_VALIDATION_RESULT'; result: DTCGValidationResult }
  | { type: 'UNUSED_TOKENS_RESULT'; result: UnusedTokensResult }
  | { type: 'ORPHANED_VALUES_RESULT'; result: OrphanedValuesResult }
  // Phase 7: Multi-File & Team Sync
  | { type: 'SYNC_CONFIG_LOADED'; config: SyncConfig | null }
  | { type: 'SYNC_CONFIG_SAVED' }
  // Phase 8: Web Bridge
  | { type: 'BRIDGE_TOKEN_LOADED'; token: string | null }
  | { type: 'BRIDGE_TOKEN_SAVED' }
  | { type: 'BRIDGE_TOKEN_CLEARED' }
  | { type: 'BRIDGE_CONFIG_RESULT'; projects: BridgeProject[]; error?: string }
  | { type: 'BRIDGE_KEYS_RESULT'; githubToken?: string; error?: string }
  // Component Pattern Library
  | { type: 'COMPONENT_PATTERNS_LOADED'; patterns: ComponentPattern[] }
  | { type: 'COMPONENT_PATTERN_SAVED'; pattern: ComponentPattern }
  | { type: 'COMPONENT_PATTERN_DELETED'; patternId: string }
  | { type: 'PATTERN_EXPORT_RESULT'; spec: ExportedNode; nodeCount: number };

// ========================================
// Connection Status
// ========================================
export type ConnectionStatus = 'disconnected' | 'validating' | 'connected' | 'error';

export interface ConnectionState {
  github: ConnectionStatus;
}

export interface SelectionExport {
  nodeId: string;
  name: string;
  type: string;
}

// ========================================
// W3C DTCG Token Format Types
// ========================================

export type DTCGTokenType = 'color' | 'dimension' | 'string' | 'boolean' | 'typography' | 'shadow';

export interface DTCGTypographyValue {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

export interface DTCGShadowValue {
  color: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
}

export type DTCGValue = string | number | boolean | DTCGTypographyValue | DTCGShadowValue;

export interface FigmaTokenExtension {
  variableId?: string;
  collectionName?: string;
  modes?: Record<string, DTCGValue>;
  scopes?: string[];
  styleId?: string;
  styleName?: string;
}

export interface DTCGToken {
  $type: DTCGTokenType;
  $value: DTCGValue;
  $description?: string;
  $extensions?: {
    figma: FigmaTokenExtension;
  };
}

export interface DTCGGroup {
  [key: string]: DTCGToken | DTCGGroup;
}

export interface TokenMetadata {
  source: 'cosmikit';
  figmaFileName: string;
  figmaFileKey?: string;
  lastSynced: string;
  version: string;
}

export interface DesignTokensDocument {
  metadata: TokenMetadata;
  [groupPath: string]: DTCGToken | DTCGGroup | TokenMetadata;
}

export interface TokenExtractionSummary {
  colorCount: number;
  dimensionCount: number;
  typographyCount: number;
  shadowCount: number;
  stringCount: number;
  booleanCount: number;
  totalCount: number;
  collectionNames: string[];
}

// ========================================
// Raw Figma Extraction Types
// (intermediate format from code.ts → UI)
// ========================================

export interface RawFigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  description: string;
  collectionName: string;
  collectionId: string;
  scopes: string[];
  valuesByMode: Record<string, string | number | boolean>;
  defaultValue: string | number | boolean;
  aliasName?: string;
}

export interface RawFigmaTextStyle {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: { value: number; unit: 'PIXELS' | 'PERCENT' };
  lineHeight: { value: number; unit: 'PIXELS' | 'PERCENT' } | { unit: 'AUTO' };
  paragraphSpacing: number;
  textDecoration: string;
  textCase: string;
}

export interface RawFigmaShadowEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  color: string;
  offsetX: number;
  offsetY: number;
  radius: number;
  spread: number;
}

export interface RawFigmaEffectStyle {
  id: string;
  name: string;
  description: string;
  effects: RawFigmaShadowEffect[];
}

export interface RawExtractionResult {
  variables: RawFigmaVariable[];
  textStyles: RawFigmaTextStyle[];
  effectStyles: RawFigmaEffectStyle[];
  figmaFileName: string;
  figmaFileKey?: string;
}

// ========================================
// Diff Engine Types
// ========================================

export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface TokenDiffEntry {
  path: string;
  changeType: DiffChangeType;
  localToken?: DTCGToken;
  remoteToken?: DTCGToken;
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  total: number;
}

export interface TokenDiffResult {
  entries: TokenDiffEntry[];
  summary: DiffSummary;
}

// ========================================
// Pull Flow Types (GitHub → Figma)
// ========================================

export interface VariableUpdateInstruction {
  variableId: string;
  tokenPath: string;
  newValue: string | number | boolean;
  tokenType: DTCGTokenType;
  modeUpdates?: Array<{
    modeName: string;
    value: string | number | boolean;
  }>;
}

export interface ApplyTokensResult {
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

// ========================================
// Design Spec Types (Claude AI Generation)
// ========================================

export type DesignNodeType =
  | 'FRAME'
  | 'TEXT'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'IMAGE'
  | 'VECTOR';

export interface DesignSpecPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DesignSpecEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  color?: string;
  offsetX?: number;
  offsetY?: number;
  radius?: number;
  spread?: number;
  visible?: boolean;
}

export interface DesignSpecGradient {
  type: 'LINEAR' | 'RADIAL';
  stops: Array<{ position: number; color: string }>;
  angle?: number;
}

export interface DesignSpecNode {
  type: DesignNodeType;
  name?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  // Individual corner radii
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  // Auto layout
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  padding?: DesignSpecPadding;
  itemSpacing?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  // Sizing modes
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  layoutGrow?: number;
  layoutAlign?: 'STRETCH' | 'INHERIT';
  // Clipping
  clipsContent?: boolean;
  // Text
  characters?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAutoResize?: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'NONE' | 'TRUNCATE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  lineHeight?: number | string;
  letterSpacing?: number;
  // Effects and gradients
  effects?: DesignSpecEffect[];
  fillGradient?: DesignSpecGradient;
  // Blend mode
  blendMode?: 'PASS_THROUGH' | 'NORMAL' | 'DARKEN' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY';
  // Component
  componentKey?: string;
  children?: DesignSpecNode[];
}

export interface CreateDesignResult {
  nodeId: string;
  nodeName: string;
  childCount: number;
  errors: string[];
}

// ========================================
// Selection Export Types (Reverse Sync)
// ========================================

export interface ExportedNode {
  type: DesignNodeType;
  name: string;
  nodeId: string;
  width: number;
  height: number;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  padding?: DesignSpecPadding;
  itemSpacing?: number;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  layoutGrow?: number;
  layoutAlign?: 'STRETCH' | 'INHERIT';
  clipsContent?: boolean;
  characters?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAutoResize?: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'NONE' | 'TRUNCATE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  lineHeight?: number | string;
  letterSpacing?: number;
  effects?: DesignSpecEffect[];
  blendMode?: string;
  boundVariables?: Record<string, string>;
  children?: ExportedNode[];
}

export interface SelectionExportResult {
  root: ExportedNode;
  nodeCount: number;
  boundVariableCount: number;
  warnings: string[];
}

// ========================================
// Token Auto-Mapping Types
// ========================================

export type AutoMapPropertyType =
  | 'fill'
  | 'stroke'
  | 'fontSize'
  | 'cornerRadius'
  | 'itemSpacing'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'opacity'
  | 'strokeWidth'
  | 'letterSpacing'
  | 'lineHeight';

export interface TokenSuggestion {
  variableId: string;
  variableName: string;
  collectionName: string;
  currentValue: string | number;
  tokenValue: string | number;
  confidence: number;
  matchType: 'exact' | 'close' | 'approximate';
  deltaE?: number;
}

export interface AutoMapNodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  property: AutoMapPropertyType;
  currentValue: string | number;
  suggestions: TokenSuggestion[];
}

export interface AutoMapResult {
  mappings: AutoMapNodeResult[];
  totalHardCoded: number;
  totalSuggestions: number;
  scanDuration: number;
}

export interface TokenBindingInstruction {
  nodeId: string;
  property: AutoMapPropertyType;
  variableId: string;
}

export interface ApplyBindingsResult {
  boundCount: number;
  skippedCount: number;
  errors: string[];
}

// ========================================
// Sync History Types (Feature 7)
// ========================================

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  direction: 'push' | 'pull';
  commitSha?: string;
  user?: string;
  changes: SyncHistoryChange[];
  tokenDocumentSnapshot?: string;
  filePath?: string;
}

export interface SyncHistoryChange {
  path: string;
  changeType: DiffChangeType;
  oldValue?: string;
  newValue?: string;
}

// ========================================
// Chat Types (Feature 8)
// ========================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ========================================
// Batch Operations Types (Feature 9)
// ========================================

export interface DTCGValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
  warnings: Array<{ path: string; message: string }>;
  totalChecked: number;
}

export interface UnusedTokensResult {
  unusedTokens: Array<{
    variableId: string;
    variableName: string;
    collectionName: string;
    type: string;
  }>;
  totalScanned: number;
  scanDuration: number;
}

export interface OrphanedValuesResult {
  orphanedValues: Array<{
    nodeId: string;
    nodeName: string;
    property: string;
    value: string | number;
  }>;
  totalScanned: number;
  scanDuration: number;
}

// ========================================
// Multi-File & Team Sync Types (Feature 10)
// ========================================

export type SyncMode = 'single' | 'multi';
export type PushMode = 'direct' | 'pr';
export type FileMapping = Record<string, string>; // collectionName -> filePath

export interface SyncConfig {
  syncMode: SyncMode;
  pushMode: PushMode;
  fileMapping: FileMapping;
  defaultDirectory: string;
  baseBranch: string;
}

export type FileSyncStatus = 'in-sync' | 'local-only' | 'remote-only' | 'modified' | 'conflict';

export interface FileSyncInfo {
  collectionName: string;
  filePath: string;
  status: FileSyncStatus;
  localDocument: DesignTokensDocument | null;
  remoteDocument: DesignTokensDocument | null;
  remoteSha: string | null;
  diffResult: TokenDiffResult | null;
  lastCommitBy?: string;
  lastCommitSha?: string;
}

export interface GitHubPRInfo {
  number: number;
  title: string;
  htmlUrl: string;
  headBranch: string;
  createdAt: string;
  mergeable: boolean | null;
  user: string;
}

export type ConflictResolution = 'keep-local' | 'keep-remote';

export interface MultiFilePushResult {
  branchName?: string;
  commitSha: string;
  prNumber?: number;
  prUrl?: string;
  filesWritten: number;
  errors: string[];
}

// ========================================
// Web Bridge Types (Phase 8)
// ========================================

export interface BridgeProject {
  id: string;
  name: string;
  githubRepo: string;
  githubBranch: string;
  githubFilePath: string;
  syncMode: SyncMode;
  pushMode: PushMode;
  fileMapping: FileMapping;
  defaultDirectory: string;
}

// ========================================
// Component Pattern Library Types
// ========================================

export type PatternCategory = 'button' | 'card' | 'navigation' | 'form' | 'layout' | 'modal' | 'list' | 'other';

export interface ComponentPattern {
  id: string;
  name: string;
  category: PatternCategory;
  tags: string[];
  description: string;
  spec: ExportedNode;
  tokensUsed: string[];
  dimensions: { width: number; height: number };
  createdAt: string;
}

export interface ComponentPatternInput {
  name: string;
  category: PatternCategory;
  tags: string[];
  description: string;
}

/**
 * Summarize a component pattern's structure for inclusion in Claude's prompt.
 * Returns a compact structural description like "FRAME[VERTICAL] > TEXT + FRAME[HORIZONTAL] > TEXT, TEXT"
 */
export function summarizePatternStructure(node: ExportedNode, depth: number = 0): string {
  if (depth > 3) return '...';

  let desc: string = node.type;
  if (node.type === 'FRAME' && node.layoutMode) {
    desc = `FRAME[${node.layoutMode}]`;
  }

  if (!node.children || node.children.length === 0) {
    return desc;
  }

  const childSummaries = node.children
    .slice(0, 5) // Limit to avoid huge summaries
    .map((c) => summarizePatternStructure(c, depth + 1));

  if (node.children.length > 5) {
    childSummaries.push(`+${node.children.length - 5} more`);
  }

  return `${desc} > ${childSummaries.join(', ')}`;
}
