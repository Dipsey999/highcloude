/**
 * Design Rules Engine — validates generated DesignSpecNode trees against
 * design system best practices before applying to Figma.
 */

import type { DesignSpecNode } from '../types/messages';

export type RuleSeverity = 'error' | 'warning' | 'info';
export type RuleCategory = 'spacing' | 'color' | 'typography' | 'layout' | 'accessibility' | 'naming';

export interface DesignRuleViolation {
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  category: RuleCategory;
  message: string;
  nodePath: string;
  suggestion?: string;
}

export interface DesignRulesResult {
  violations: DesignRuleViolation[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passed: boolean;
}

// Common spacing scale values (4-point grid)
const SPACING_SCALE = new Set([0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 128]);

/**
 * Run all design rules against a spec tree.
 */
export function validateDesignSpec(
  spec: DesignSpecNode,
  availableTokenPaths?: string[],
): DesignRulesResult {
  const violations: DesignRuleViolation[] = [];

  walkSpec(spec, 'root', (node, path) => {
    checkAutoLayout(node, path, violations);
    checkSpacingConsistency(node, path, violations);
    checkNamingConventions(node, path, violations);
    checkTokenCoverage(node, path, violations, availableTokenPaths);
    checkTouchTargets(node, path, violations);
    checkTypographyHierarchy(node, path, violations);
    checkTextContent(node, path, violations);
  });

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;
  const infoCount = violations.filter((v) => v.severity === 'info').length;

  return {
    violations,
    errorCount,
    warningCount,
    infoCount,
    passed: errorCount === 0,
  };
}

/**
 * Walk a spec tree depth-first, calling the visitor for each node.
 */
function walkSpec(
  node: DesignSpecNode,
  path: string,
  visitor: (node: DesignSpecNode, path: string) => void,
): void {
  visitor(node, path);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childName = child.name ?? `${child.type}[${i}]`;
      walkSpec(child, `${path} > ${childName}`, visitor);
    }
  }
}

// ========================================
// Individual Rule Checks
// ========================================

/**
 * Rule: Frames with children should use auto layout.
 */
function checkAutoLayout(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  if (node.type === 'FRAME' && node.children && node.children.length > 0) {
    if (!node.layoutMode || node.layoutMode === 'NONE') {
      violations.push({
        ruleId: 'layout-auto',
        ruleName: 'Auto Layout Required',
        severity: 'warning',
        category: 'layout',
        message: 'Frame with children should use auto layout instead of absolute positioning.',
        nodePath: path,
        suggestion: 'Add "layoutMode": "VERTICAL" or "HORIZONTAL"',
      });
    }
  }
}

/**
 * Rule: Spacing values should follow the spacing scale.
 */
function checkSpacingConsistency(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  if (node.itemSpacing != null && !SPACING_SCALE.has(node.itemSpacing)) {
    const nearest = findNearestScale(node.itemSpacing);
    violations.push({
      ruleId: 'spacing-scale',
      ruleName: 'Spacing Scale',
      severity: 'info',
      category: 'spacing',
      message: `Item spacing ${node.itemSpacing}px doesn't match the 4-point spacing scale.`,
      nodePath: path,
      suggestion: `Consider using ${nearest}px instead`,
    });
  }

  if (node.padding) {
    for (const [side, value] of Object.entries(node.padding)) {
      if (!SPACING_SCALE.has(value)) {
        const nearest = findNearestScale(value);
        violations.push({
          ruleId: 'spacing-scale',
          ruleName: 'Spacing Scale',
          severity: 'info',
          category: 'spacing',
          message: `Padding ${side} ${value}px doesn't match the 4-point spacing scale.`,
          nodePath: path,
          suggestion: `Consider using ${nearest}px instead`,
        });
      }
    }
  }
}

/**
 * Rule: Node names should be descriptive.
 */
function checkNamingConventions(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  const genericNames = ['Frame', 'Rectangle', 'Text', 'Group', 'Ellipse', 'Vector'];
  if (node.name && genericNames.includes(node.name)) {
    violations.push({
      ruleId: 'naming-descriptive',
      ruleName: 'Descriptive Naming',
      severity: 'info',
      category: 'naming',
      message: `Node name "${node.name}" is generic. Use a descriptive name.`,
      nodePath: path,
      suggestion: 'Use names like "Profile Card", "Submit Button", "Navigation Bar"',
    });
  }
}

/**
 * Rule: Warn when hard-coded hex colors are used while tokens are available.
 */
function checkTokenCoverage(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
  tokenPaths?: string[],
): void {
  if (!tokenPaths || tokenPaths.length === 0) return;

  const hasColorTokens = tokenPaths.some((t) => t.includes('(color)'));

  if (hasColorTokens && node.fill && node.fill.startsWith('#')) {
    violations.push({
      ruleId: 'token-coverage',
      ruleName: 'Token Coverage',
      severity: 'warning',
      category: 'color',
      message: `Hard-coded color "${node.fill}" used instead of a design token.`,
      nodePath: path,
      suggestion: 'Replace with a token reference like $color.primary',
    });
  }

  if (hasColorTokens && node.stroke && node.stroke.startsWith('#')) {
    violations.push({
      ruleId: 'token-coverage',
      ruleName: 'Token Coverage',
      severity: 'info',
      category: 'color',
      message: `Hard-coded stroke color "${node.stroke}" used instead of a design token.`,
      nodePath: path,
      suggestion: 'Replace with a token reference like $color.border.default',
    });
  }
}

/**
 * Rule: Interactive elements should meet minimum touch target sizes.
 */
function checkTouchTargets(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  const isInteractive = node.name?.toLowerCase().includes('button') ||
    node.name?.toLowerCase().includes('link') ||
    node.name?.toLowerCase().includes('tap') ||
    node.name?.toLowerCase().includes('click');

  if (isInteractive && node.width != null && node.height != null) {
    if (node.width < 44 || node.height < 44) {
      violations.push({
        ruleId: 'touch-target',
        ruleName: 'Touch Target Size',
        severity: 'warning',
        category: 'accessibility',
        message: `Interactive element "${node.name}" is ${node.width}x${node.height}px, below the 44x44px minimum.`,
        nodePath: path,
        suggestion: 'Increase size to at least 44x44px for accessibility',
      });
    }
  }
}

/**
 * Rule: Font sizes should follow a reasonable hierarchy.
 */
function checkTypographyHierarchy(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  if (node.type !== 'TEXT') return;

  // Warn on very small text
  if (node.fontSize != null && node.fontSize < 11) {
    violations.push({
      ruleId: 'typography-minimum',
      ruleName: 'Minimum Font Size',
      severity: 'warning',
      category: 'typography',
      message: `Font size ${node.fontSize}px is below the minimum readable size of 11px.`,
      nodePath: path,
      suggestion: 'Use at least 11px for body text, 12-14px recommended',
    });
  }
}

/**
 * Rule: TEXT nodes must have characters.
 */
function checkTextContent(
  node: DesignSpecNode,
  path: string,
  violations: DesignRuleViolation[],
): void {
  if (node.type === 'TEXT' && (!node.characters || node.characters.trim() === '')) {
    violations.push({
      ruleId: 'text-content',
      ruleName: 'Text Content Required',
      severity: 'error',
      category: 'layout',
      message: 'TEXT node has no characters content.',
      nodePath: path,
      suggestion: 'Add a "characters" field with the text content',
    });
  }
}

/**
 * Find the nearest value in the spacing scale.
 */
function findNearestScale(value: number): number {
  const arr = Array.from(SPACING_SCALE);
  let nearest = arr[0];
  let minDist = Math.abs(value - nearest);
  for (const s of arr) {
    const dist = Math.abs(value - s);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }
  return nearest;
}
