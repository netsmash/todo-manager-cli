import { TFlowStepColor } from 'todo-manager';
import { isFlowStepColor } from './flow-step';

export type TFlowStepEditionActions = 'edit' | 'remove' | 'add' | 'keep';
const flowStepEditionActions = new Set(['edit', 'remove', 'add', 'keep']);

interface IFlowStepEditionActionBase {
  action: TFlowStepEditionActions;
  name: string;
  description?: string;
  color?: TFlowStepColor;
}

export interface IFlowStepEditionActionAdd extends IFlowStepEditionActionBase {
  action: 'add';
}

export interface IFlowStepEditionActionKeep extends IFlowStepEditionActionBase {
  action: 'keep';
}

export interface IFlowStepEditionActionEdit extends IFlowStepEditionActionBase {
  action: 'edit';
  newName?: string;
}

export interface IFlowStepEditionActionRemove
  extends IFlowStepEditionActionBase {
  action: 'remove';
}

export type TFlowStepEditionAction =
  | IFlowStepEditionActionKeep
  | IFlowStepEditionActionEdit
  | IFlowStepEditionActionAdd
  | IFlowStepEditionActionRemove;

export const isFlowStepEditionAction = (
  obj: any,
): obj is TFlowStepEditionAction => {
  return (
    typeof obj === 'object' &&
    'name' in obj &&
    typeof obj['name'] === 'string' &&
    'action' in obj &&
    typeof obj['action'] === 'string' &&
    flowStepEditionActions.has(obj['action']) &&
    (!('color' in obj) || isFlowStepColor(obj['color']))
  );
};

export interface IFlowEdition {
  name: string;
  description?: string;
  steps?: TFlowStepEditionAction[];
  default?: string;
}

export const isFlowEdition = (obj: any): obj is IFlowEdition => {
  const checkSteps = (steps: any[], obj: any): boolean => {
    if (!steps.every(isFlowStepEditionAction)) {
      return false;
    }
    const stepsByName: Map<string, TFlowStepEditionAction> = new Map(
      steps.map((step) => [
        step.action === 'edit' && 'newName' in step
          ? (step['newName'] as string)
          : step['name'],
        step,
      ]),
    );
    if (stepsByName.size !== steps.length) {
      return false;
    }
    if ('default' in obj) {
      if (typeof obj['default'] !== 'string') {
        return false;
      }
      const defaultName = obj['default'];
      const step = stepsByName.get(defaultName);
      if (step === undefined || step.action === 'remove') {
        return false;
      }
    }
    return true;
  };

  return (
    typeof obj === 'object' &&
    'name' in obj &&
    typeof obj['name'] === 'string' &&
    (!('description' in obj) || typeof obj['description'] === 'string') &&
    (!('steps' in obj) ||
      (typeof obj['steps'] === 'object' &&
        Array.isArray(obj['steps']) &&
        checkSteps(obj['steps'], obj)))
  );
};
