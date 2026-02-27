/**
 * Accessibility Checker — validates contrast ratios and touch targets
 * for generated design specs.
 */

import type { DesignSpecNode } from '../types/messages';

export type AccessibilitySeverity = 'error' | 'warning';

export interface AccessibilityIssue {
  severity: AccessibilitySeverity;
  wcagLevel: 'AA' | 'AAA';
  type: 'contrast' | 'touch-target' | 'text-size';
  message: string;
  nodePath: string;
  currentRatio?: number;
  requiredRatio?: number;
  suggestion?: string;
}

export interface AccessibilityResult {
  issues: AccessibilityIssue[];
  errorCount: number;
  warningCount: number;
  passed: boolean;
}

/**
 * Check a DesignSpecNode tree for accessibility issues.
 * Checks contrast ratios between background fills and text colors,
 * touch target sizes, and minimum text sizes.
 */
export function checkAccessibility(spec: DesignSpecNode): AccessibilityResult {
  const issues: AccessibilityIssue[] = [];
  walkForAccessibility(spec, 'root', null, issues);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    issues,
    errorCount,
    warningCount,
    passed: errorCount === 0,
  };
}

/**
 * Walk the spec tree, tracking parent background colors for contrast checks.
 */
function walkForAccessibility(
  node: DesignSpecNode,
  path: string,
  parentBg: string | null,
  issues: AccessibilityIssue[],
): void {
  // Track the current background
  const currentBg = (node.type === 'FRAME' && node.fill && !node.fill.startsWith('$'))
    ? node.fill
    : parentBg;

  // Check contrast for text nodes
  if (node.type === 'TEXT' && node.fill && !node.fill.startsWith('$') && currentBg) {
    const bgColor = parseHexColor(currentBg);
    const textColor = parseHexColor(node.fill);

    if (bgColor && textColor) {
      const ratio = contrastRatio(bgColor, textColor);
      const isLargeText = (node.fontSize ?? 14) >= 18 ||
        ((node.fontSize ?? 14) >= 14 && (node.fontWeight ?? 400) >= 700);

      const requiredAA = isLargeText ? 3 : 4.5;
      const requiredAAA = isLargeText ? 4.5 : 7;

      if (ratio < requiredAA) {
        issues.push({
          severity: 'error',
          wcagLevel: 'AA',
          type: 'contrast',
          message: `Text "${node.characters?.slice(0, 30) ?? ''}" has contrast ratio ${ratio.toFixed(2)}:1 (requires ${requiredAA}:1 for WCAG AA).`,
          nodePath: path,
          currentRatio: ratio,
          requiredRatio: requiredAA,
          suggestion: 'Use a darker text color or lighter background',
        });
      } else if (ratio < requiredAAA) {
        issues.push({
          severity: 'warning',
          wcagLevel: 'AAA',
          type: 'contrast',
          message: `Text "${node.characters?.slice(0, 30) ?? ''}" passes AA but not AAA (${ratio.toFixed(2)}:1 vs ${requiredAAA}:1).`,
          nodePath: path,
          currentRatio: ratio,
          requiredRatio: requiredAAA,
        });
      }
    }
  }

  // Check minimum text size
  if (node.type === 'TEXT' && node.fontSize != null && node.fontSize < 12) {
    issues.push({
      severity: 'warning',
      wcagLevel: 'AA',
      type: 'text-size',
      message: `Text "${node.characters?.slice(0, 20) ?? ''}" uses ${node.fontSize}px, below the recommended 12px minimum.`,
      nodePath: path,
      suggestion: 'Increase font size to at least 12px',
    });
  }

  // Check touch targets
  const isInteractive = node.name?.toLowerCase().includes('button') ||
    node.name?.toLowerCase().includes('link') ||
    node.name?.toLowerCase().includes('input') ||
    node.name?.toLowerCase().includes('checkbox') ||
    node.name?.toLowerCase().includes('toggle');

  if (isInteractive && node.width != null && node.height != null) {
    if (node.width < 44 || node.height < 44) {
      issues.push({
        severity: 'error',
        wcagLevel: 'AA',
        type: 'touch-target',
        message: `"${node.name}" is ${node.width}x${node.height}px, below 44x44px minimum touch target.`,
        nodePath: path,
        suggestion: 'Increase dimensions to at least 44x44px',
      });
    }
  }

  // Recurse into children
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childName = child.name ?? `${child.type}[${i}]`;
      walkForAccessibility(child, `${path} > ${childName}`, currentBg, issues);
    }
  }
}

// ========================================
// Color Utilities
// ========================================

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

function parseHexColor(hex: string): RGBColor | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;

  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else {
    r = parseInt(cleaned.substring(0, 2), 16) / 255;
    g = parseInt(cleaned.substring(2, 4), 16) / 255;
    b = parseInt(cleaned.substring(4, 6), 16) / 255;
  }

  if ([r, g, b].some(isNaN)) return null;
  return { r, g, b };
}

/**
 * Calculate relative luminance per WCAG 2.1.
 */
function relativeLuminance(c: RGBColor): number {
  const sRGBtoLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * sRGBtoLinear(c.r) + 0.7152 * sRGBtoLinear(c.g) + 0.0722 * sRGBtoLinear(c.b);
}

/**
 * Calculate WCAG 2.1 contrast ratio between two colors.
 */
function contrastRatio(c1: RGBColor, c2: RGBColor): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
