/**
 * Component DTCG token templates.
 * Each component generates tokens that reference foundation aliases like {color.primary.500}.
 */

import type { ComponentType } from './domain-presets';

interface DTCGNode {
  $type: string;
  $value: string;
  $description?: string;
}

type TokenTree = Record<string, DTCGNode | Record<string, DTCGNode | Record<string, DTCGNode>>>;

export const COMPONENT_LABELS: Record<ComponentType, { label: string; description: string }> = {
  button:   { label: 'Button',   description: 'Primary, secondary, ghost, destructive variants with states' },
  input:    { label: 'Input',    description: 'Text fields with default, focus, error, disabled states' },
  card:     { label: 'Card',     description: 'Container cards with outlined and elevated variants' },
  badge:    { label: 'Badge',    description: 'Status labels and tag indicators' },
  avatar:   { label: 'Avatar',   description: 'User profile images with size variants' },
  toggle:   { label: 'Toggle',   description: 'On/off switch control' },
  select:   { label: 'Select',   description: 'Dropdown selection menus' },
  alert:    { label: 'Alert',    description: 'Info, success, warning, and error notifications' },
  tooltip:  { label: 'Tooltip',  description: 'Contextual hover information' },
  modal:    { label: 'Modal',    description: 'Dialog overlays with backdrop' },
  tabs:     { label: 'Tabs',     description: 'Tabbed navigation for content switching' },
  checkbox: { label: 'Checkbox', description: 'Single and group selection controls' },
};

function t(type: string, value: string, description?: string): DTCGNode {
  const node: DTCGNode = { $type: type, $value: value };
  if (description) node.$description = description;
  return node;
}

export function getComponentTokens(componentType: ComponentType): TokenTree {
  switch (componentType) {
    case 'button':
      return {
        primary: {
          background:       t('color', '{color.primary.500}', 'Primary button background'),
          'background-hover': t('color', '{color.primary.600}'),
          'background-active': t('color', '{color.primary.700}'),
          text:             t('color', '#ffffff'),
          'border-radius':  t('dimension', '{radius.md}'),
          'padding-x':      t('dimension', '{spacing.4}'),
          'padding-y':      t('dimension', '{spacing.2}'),
          'font-size':      t('dimension', '{typography.size.sm}'),
          'font-weight':    t('string', '500'),
        },
        secondary: {
          background:       t('color', '{color.neutral.100}'),
          'background-hover': t('color', '{color.neutral.200}'),
          text:             t('color', '{color.neutral.800}'),
          border:           t('color', '{color.neutral.300}'),
          'border-radius':  t('dimension', '{radius.md}'),
          'padding-x':      t('dimension', '{spacing.4}'),
          'padding-y':      t('dimension', '{spacing.2}'),
        },
        ghost: {
          background:       t('color', 'transparent'),
          'background-hover': t('color', '{color.neutral.100}'),
          text:             t('color', '{color.neutral.700}'),
          'border-radius':  t('dimension', '{radius.md}'),
        },
        destructive: {
          background:       t('color', '{color.error}'),
          'background-hover': t('color', '#b91c1c'),
          text:             t('color', '#ffffff'),
          'border-radius':  t('dimension', '{radius.md}'),
        },
        disabled: {
          background:       t('color', '{color.neutral.200}'),
          text:             t('color', '{color.neutral.400}'),
        },
      };

    case 'input':
      return {
        default: {
          background:       t('color', '{color.neutral.50}'),
          border:           t('color', '{color.neutral.300}'),
          text:             t('color', '{color.neutral.900}'),
          placeholder:      t('color', '{color.neutral.400}'),
          'border-radius':  t('dimension', '{radius.md}'),
          'padding-x':      t('dimension', '{spacing.3}'),
          'padding-y':      t('dimension', '{spacing.2}'),
          'font-size':      t('dimension', '{typography.size.sm}'),
        },
        focus: {
          border:           t('color', '{color.primary.500}'),
          'ring-color':     t('color', '{color.primary.200}'),
          'ring-width':     t('dimension', '3px'),
        },
        error: {
          border:           t('color', '{color.error}'),
          'ring-color':     t('color', '#fecaca'),
        },
        disabled: {
          background:       t('color', '{color.neutral.100}'),
          text:             t('color', '{color.neutral.400}'),
        },
      };

    case 'card':
      return {
        default: {
          background:       t('color', '#ffffff', 'Card background'),
          border:           t('color', '{color.neutral.200}'),
          'border-radius':  t('dimension', '{radius.lg}'),
          padding:          t('dimension', '{spacing.6}'),
          shadow:           t('shadow', '{shadow.sm}'),
        },
        elevated: {
          background:       t('color', '#ffffff'),
          'border-radius':  t('dimension', '{radius.lg}'),
          padding:          t('dimension', '{spacing.6}'),
          shadow:           t('shadow', '{shadow.md}'),
        },
        interactive: {
          'hover-shadow':   t('shadow', '{shadow.lg}'),
          'hover-translate': t('dimension', '-2px'),
        },
      };

    case 'badge':
      return {
        default: {
          background:       t('color', '{color.primary.100}'),
          text:             t('color', '{color.primary.700}'),
          'border-radius':  t('dimension', '{radius.full}'),
          'padding-x':      t('dimension', '{spacing.2}'),
          'padding-y':      t('dimension', '2px'),
          'font-size':      t('dimension', '{typography.size.xs}'),
          'font-weight':    t('string', '500'),
        },
        success: {
          background:       t('color', '#dcfce7'),
          text:             t('color', '#166534'),
        },
        warning: {
          background:       t('color', '#fef3c7'),
          text:             t('color', '#92400e'),
        },
        error: {
          background:       t('color', '#fee2e2'),
          text:             t('color', '#991b1b'),
        },
      };

    case 'avatar':
      return {
        sm: {
          size:             t('dimension', '32px'),
          'border-radius':  t('dimension', '{radius.full}'),
          'font-size':      t('dimension', '{typography.size.xs}'),
        },
        md: {
          size:             t('dimension', '40px'),
          'border-radius':  t('dimension', '{radius.full}'),
          'font-size':      t('dimension', '{typography.size.sm}'),
        },
        lg: {
          size:             t('dimension', '48px'),
          'border-radius':  t('dimension', '{radius.full}'),
          'font-size':      t('dimension', '{typography.size.md}'),
        },
        fallback: {
          background:       t('color', '{color.primary.100}'),
          text:             t('color', '{color.primary.700}'),
        },
      };

    case 'toggle':
      return {
        track: {
          'background-off': t('color', '{color.neutral.300}'),
          'background-on':  t('color', '{color.primary.500}'),
          width:            t('dimension', '44px'),
          height:           t('dimension', '24px'),
          'border-radius':  t('dimension', '{radius.full}'),
        },
        thumb: {
          background:       t('color', '#ffffff'),
          size:             t('dimension', '20px'),
          'border-radius':  t('dimension', '{radius.full}'),
          shadow:           t('shadow', '{shadow.sm}'),
        },
      };

    case 'select':
      return {
        trigger: {
          background:       t('color', '{color.neutral.50}'),
          border:           t('color', '{color.neutral.300}'),
          text:             t('color', '{color.neutral.900}'),
          'border-radius':  t('dimension', '{radius.md}'),
          'padding-x':      t('dimension', '{spacing.3}'),
          'padding-y':      t('dimension', '{spacing.2}'),
        },
        dropdown: {
          background:       t('color', '#ffffff'),
          border:           t('color', '{color.neutral.200}'),
          'border-radius':  t('dimension', '{radius.md}'),
          shadow:           t('shadow', '{shadow.lg}'),
        },
        option: {
          'hover-background': t('color', '{color.primary.50}'),
          'selected-background': t('color', '{color.primary.100}'),
          'selected-text':  t('color', '{color.primary.700}'),
        },
      };

    case 'alert':
      return {
        info: {
          background:       t('color', '#eff6ff'),
          border:           t('color', '{color.info}'),
          text:             t('color', '#1e40af'),
          'icon-color':     t('color', '{color.info}'),
        },
        success: {
          background:       t('color', '#f0fdf4'),
          border:           t('color', '{color.success}'),
          text:             t('color', '#166534'),
        },
        warning: {
          background:       t('color', '#fffbeb'),
          border:           t('color', '{color.warning}'),
          text:             t('color', '#92400e'),
        },
        error: {
          background:       t('color', '#fef2f2'),
          border:           t('color', '{color.error}'),
          text:             t('color', '#991b1b'),
        },
        'border-radius':    t('dimension', '{radius.md}'),
        padding:            t('dimension', '{spacing.4}'),
      };

    case 'tooltip':
      return {
        background:         t('color', '{color.neutral.900}'),
        text:               t('color', '#ffffff'),
        'border-radius':    t('dimension', '{radius.sm}'),
        'padding-x':        t('dimension', '{spacing.2}'),
        'padding-y':        t('dimension', '{spacing.1}'),
        'font-size':        t('dimension', '{typography.size.xs}'),
        shadow:             t('shadow', '{shadow.md}'),
      };

    case 'modal':
      return {
        overlay: {
          background:       t('color', 'rgba(0,0,0,0.5)'),
        },
        content: {
          background:       t('color', '#ffffff'),
          'border-radius':  t('dimension', '{radius.xl}'),
          shadow:           t('shadow', '{shadow.xl}'),
          padding:          t('dimension', '{spacing.6}'),
          'max-width':      t('dimension', '480px'),
        },
      };

    case 'tabs':
      return {
        list: {
          'border-bottom':  t('color', '{color.neutral.200}'),
          gap:              t('dimension', '{spacing.1}'),
        },
        trigger: {
          text:             t('color', '{color.neutral.500}'),
          'text-active':    t('color', '{color.primary.600}'),
          'border-active':  t('color', '{color.primary.500}'),
          'font-weight':    t('string', '500'),
          'padding-x':      t('dimension', '{spacing.3}'),
          'padding-y':      t('dimension', '{spacing.2}'),
        },
      };

    case 'checkbox':
      return {
        box: {
          size:             t('dimension', '18px'),
          'border-radius':  t('dimension', '{radius.sm}'),
          border:           t('color', '{color.neutral.300}'),
          'background-checked': t('color', '{color.primary.500}'),
          'check-color':    t('color', '#ffffff'),
        },
        label: {
          'font-size':      t('dimension', '{typography.size.sm}'),
          text:             t('color', '{color.neutral.800}'),
          gap:              t('dimension', '{spacing.2}'),
        },
      };
  }
}

export function getAllSelectedComponentTokens(selected: ComponentType[]): Record<string, TokenTree> {
  const result: Record<string, TokenTree> = {};
  for (const comp of selected) {
    result[comp] = getComponentTokens(comp);
  }
  return result;
}
