import { logger } from '../utils/logger';
import type { TokenBindingInstruction, ApplyBindingsResult } from '../types/messages';

/**
 * Apply user-approved token bindings to Figma nodes.
 * Binds variables to node properties (paint or scalar).
 */
export async function applyTokenBindings(
  bindings: TokenBindingInstruction[],
): Promise<ApplyBindingsResult> {
  let boundCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const binding of bindings) {
    try {
      const node = await figma.getNodeByIdAsync(binding.nodeId);
      if (!node || node.removed) {
        logger.warn(`Node not found: ${binding.nodeId}`);
        skippedCount++;
        continue;
      }

      const variable = await figma.variables.getVariableByIdAsync(binding.variableId);
      if (!variable) {
        logger.warn(`Variable not found: ${binding.variableId}`);
        skippedCount++;
        continue;
      }

      const sceneNode = node as SceneNode;

      if (binding.property === 'fill') {
        await bindPaintProperty(sceneNode, 'fills', variable, errors);
        boundCount++;
      } else if (binding.property === 'stroke') {
        await bindPaintProperty(sceneNode, 'strokes', variable, errors);
        boundCount++;
      } else {
        // Numeric property binding
        const figmaProp = mapPropertyName(binding.property);
        bindScalarProperty(sceneNode, figmaProp, variable, errors);
        boundCount++;
      }
    } catch (err) {
      const msg = `Failed to bind ${binding.property} on node ${binding.nodeId}: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`;
      logger.error(msg);
      errors.push(msg);
    }
  }

  return { boundCount, skippedCount, errors };
}

/**
 * Bind a color variable to a paint property (fills or strokes).
 */
async function bindPaintProperty(
  node: SceneNode,
  property: 'fills' | 'strokes',
  variable: Variable,
  errors: string[],
): Promise<void> {
  if (!(property in node)) {
    errors.push(`Node "${node.name}" does not support ${property}`);
    return;
  }

  const paintNode = node as GeometryMixin & SceneNode;
  const currentPaints = paintNode[property];

  if (!currentPaints || typeof currentPaints === 'symbol') {
    errors.push(`Cannot read ${property} on "${node.name}" (mixed value)`);
    return;
  }

  const paintsArr = currentPaints as readonly Paint[];

  // Create a new solid paint with the variable bound
  let basePaint: SolidPaint;
  if (paintsArr.length > 0 && paintsArr[0].type === 'SOLID') {
    basePaint = { ...paintsArr[0] } as SolidPaint;
  } else {
    basePaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  }

  try {
    const boundPaint = figma.variables.setBoundVariableForPaint(
      basePaint,
      'color',
      variable,
    );
    paintNode[property] = [boundPaint];
  } catch (err) {
    errors.push(`Could not bind variable "${variable.name}" to ${property} on "${node.name}": ${
      err instanceof Error ? err.message : 'Unknown'
    }`);
  }
}

/**
 * Bind a variable to a scalar (numeric) property.
 */
function bindScalarProperty(
  node: SceneNode,
  property: string,
  variable: Variable,
  errors: string[],
): void {
  try {
    const bindable = node as SceneNode & { setBoundVariable?: (field: string, variable: Variable) => void };
    if (typeof bindable.setBoundVariable === 'function') {
      bindable.setBoundVariable(property, variable);
    } else {
      errors.push(`Node "${node.name}" does not support setBoundVariable for "${property}"`);
    }
  } catch (err) {
    errors.push(`Could not bind "${variable.name}" to ${property} on "${node.name}": ${
      err instanceof Error ? err.message : 'Unknown'
    }`);
  }
}

/**
 * Map our property names to Figma property names for setBoundVariable.
 */
function mapPropertyName(property: string): string {
  switch (property) {
    case 'strokeWidth': return 'strokeWeight';
    default: return property;
  }
}
