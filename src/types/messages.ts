// ========================================
// UI → Code Messages
// ========================================
export type UIMessage =
  | { type: 'SAVE_CREDENTIALS'; payload: CredentialPayload }
  | { type: 'LOAD_CREDENTIALS' }
  | { type: 'CLEAR_CREDENTIALS' }
  | { type: 'EXTRACT_TOKENS' }
  | { type: 'GET_SELECTION' }
  | { type: 'APPLY_TOKENS'; instructions: VariableUpdateInstruction[] };

export interface CredentialPayload {
  claudeApiKey: string;
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
  | { type: 'APPLY_PROGRESS'; stage: string; percent: number };

// ========================================
// Connection Status
// ========================================
export type ConnectionStatus = 'disconnected' | 'validating' | 'connected' | 'error';

export interface ConnectionState {
  claude: ConnectionStatus;
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
  source: 'claude-bridge';
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
