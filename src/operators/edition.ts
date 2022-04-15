import { file } from 'tmp-promise';
import * as fs from 'fs/promises';
import YAML from 'yaml';
import { exec, spawn } from 'child_process';
import { inject, injectable } from 'inversify';
import { CliError, EditionCancelException, ParserError } from '../errors';
import {
  IFlowEdition,
  IFlowStepEditionActionAdd,
  IFlowStepEditionActionEdit,
  INameDescription,
  isFlowEdition,
  TFlowStepEditionAction,
  TFlowStepEditionActions,
} from '../models';
import {
  EntityType,
  IFlow,
  IFlowStep,
  IFlowStepUpdateProps,
  IFlowUpdateProps,
  ISaved,
  isFlow,
} from 'todo-manager';
import { Identificators } from '../identificators';
import {
  TEntityOperators,
  TFlowOperators,
  TFlowStepOperators,
} from './todo-manager';
import { asyncPipe, asyncQueuedMap } from '../lib';

@injectable()
export class EditionOperators {
  public constructor(
    @inject(Identificators.tm.EntityOperators)
    protected entity: TEntityOperators,
    @inject(Identificators.tm.FlowOperators)
    protected flow: TFlowOperators,
    @inject(Identificators.tm.FlowStepOperators)
    protected flowStep: TFlowStepOperators,
  ) {}

  public get getGitEditor() {
    return async (): Promise<string | void> => {
      const hasGit: boolean =
        (await new Promise<number | null>((resolve) =>
          exec('[ -e "$(which git)" ]').on('close', resolve),
        )) === 0;
      if (!hasGit) {
        return;
      }
      const editor = await new Promise<string>((resolve) => {
        let editor: string;
        exec('git config --global core.editor', (_, stdout) => {
          if (stdout) {
            editor = stdout;
          }
        }).on('close', () => resolve(editor));
      });
      return editor;
    };
  }

  public get getEditorCommand() {
    const getGitEditor = this.getGitEditor.bind(this);
    return async (): Promise<string> => {
      let editor: string | undefined = (await getGitEditor()) || undefined;

      if (editor !== undefined) {
        // DO NOTHING
      } else if ('GIT_EDITOR' in process.env) {
        editor = process.env['GIT_EDITOR'] as string;
      } else if ('EDITOR' in process.env) {
        editor = process.env['EDITOR'] as string;
      }
      if (editor === undefined) {
        throw new CliError(`No avaliable editor command to use.`);
      }
      return editor.trim();
    };
  }

  public get editInEditor() {
    const getEditorCommand = this.getEditorCommand.bind(this);
    return async ({
      default: defaultText = '',
      postfix = '.md',
    }: {
      default?: string;
      postfix?: string;
    }): Promise<string> => {
      const editor = await getEditorCommand();
      const { path, cleanup } = await file({ postfix });
      const { ctimeMs: createdTimeMs } = await fs.stat(path);
      await fs.writeFile(path, defaultText);
      // work with file here in fd
      await new Promise((resolve) => {
        spawn(`${editor}`, [path], { stdio: 'inherit' }).on('exit', resolve);
      });
      const editedText = await fs.readFile(path, { encoding: 'utf-8' });
      const { ctimeMs: modifiedTimeMs } = await fs.stat(path);
      await cleanup();
      if (modifiedTimeMs === createdTimeMs) {
        throw new EditionCancelException();
      }
      return editedText;
    };
  }

  public get editNameDescription() {
    const editInEditor = this.editInEditor.bind(this);
    return async ({
      default: defaultValue = { name: '' },
    }: {
      default?: INameDescription;
    }): Promise<INameDescription> => {
      const parsedDefaultValue: INameDescription = {
        name: defaultValue.name,
      };
      if ('description' in defaultValue) {
        parsedDefaultValue.description = defaultValue.description;
      }
      const defaultText = YAML.stringify(parsedDefaultValue, {
        blockQuote: 'literal',
      });
      const text = await editInEditor({
        default: defaultText,
        postfix: '.yml',
      });
      const data = YAML.parse(text);
      if (Array.isArray(data)) {
        if (data.length < 1) {
          throw new ParserError('Object should have `name` member.');
        }
        const parsedData: INameDescription = {
          name: data[0],
        };
        if (data.length > 1) {
          parsedData.description = data[1];
        }
        return parsedData;
      } else {
        if (!('name' in data)) {
          throw new ParserError('Object should have `name` member.');
        }
        const parsedData: INameDescription = {
          name: data.name,
        };
        if ('description' in data) {
          parsedData.description = data.description;
        }
        return parsedData;
      }
    };
  }

  public get createFlowStepFromAction() {
    return (flowStepAction: IFlowStepEditionActionAdd): IFlowStep => {
      const flowStep: IFlowStep = {
        type: EntityType.FlowStep,
        name: flowStepAction.name,
      };
      if ('description' in flowStepAction) {
        flowStep.description = flowStepAction.description;
      }
      if ('color' in flowStepAction) {
        flowStep.color = flowStepAction.color;
      }
      return flowStep;
    };
  }

  public get editFlowStepFromAction() {
    const ops = {
      flowStep: this.flowStep,
    };
    return <E extends IFlowStep>(flowStep: E) =>
      (flowStepAction: IFlowStepEditionActionEdit): E => {
        const editProps: IFlowStepUpdateProps = {};
        if ('newName' in flowStepAction) {
          editProps.name = flowStepAction.newName;
        }
        if ('description' in flowStepAction) {
          editProps.description = flowStepAction.description;
        }
        if ('color' in flowStepAction) {
          editProps.color = flowStepAction.color;
        }
        return ops.flowStep.update(editProps)(flowStep);
      };
  }

  public get createFlowFromEdition() {
    const ops = {
      flowStep: this.flowStep,
      flow: this.flow,
      entity: this.entity,
    };
    const createFlowStepFromAction = this.createFlowStepFromAction.bind(this);
    return async (flowEdition: IFlowEdition): Promise<IFlow> => {
      const stepActions = flowEdition.steps || [];
      const createSteps = asyncPipe(
        asyncQueuedMap(createFlowStepFromAction),
        asyncQueuedMap(ops.flowStep.save),
      );
      const steps = await createSteps(
        stepActions.filter(
          (value: TFlowStepEditionAction): value is IFlowStepEditionActionAdd =>
            value.action === 'add',
        ),
      );
      const flow: IFlow = {
        type: EntityType.Flow,
        name: flowEdition.name,
        steps: ops.entity.toCollection(steps),
        order: steps.map((step) => step.id),
      };
      if ('description' in flowEdition) {
        flow.description = flowEdition.description;
      }
      if ('default' in flowEdition) {
        flow.defaultStepId = steps.filter(
          ({ name }) => name === flowEdition.default,
        )[0]?.id;
      }
      return flow;
    };
  }

  public get editFlowFromEdition() {
    const ops = {
      flowStep: this.flowStep,
      flow: this.flow,
      entity: this.entity,
    };
    const editFlowStepFromAction = this.editFlowStepFromAction.bind(this);
    const createFlowStepFromAction = this.createFlowStepFromAction.bind(this);
    return <E extends IFlow>(flow: E) =>
      async (flowEdition: IFlowEdition): Promise<E> => {
        const stepActions = flowEdition.steps || [];
        const stepsIt = await asyncPipe(
          ops.flow.clone,
          ops.flow.getProp('steps'),
          (steps): Map<string, IFlowStep> =>
            new Map(
              Array.from(steps.values()).map((step) => [step.name, step]),
            ),
          async (stepsByName) => {
            const newSteps: (IFlowStep & ISaved)[] = [];
            for (const stepAction of stepActions) {
              if (stepAction.action === 'add') {
                const newStep = await asyncPipe(
                  createFlowStepFromAction,
                  ops.flowStep.save,
                )(stepAction);
                newSteps.push(newStep);
              } else if (stepAction.action === 'keep') {
                const step = stepsByName.get(stepAction.name) as IFlowStep &
                  ISaved;
                newSteps.push(step);
              } else if (stepAction.action === 'edit') {
                const step = stepsByName.get(stepAction.name) as IFlowStep &
                  ISaved;
                const newStep = editFlowStepFromAction(step)(stepAction);
                await ops.flowStep.save(newStep);
                newSteps.push(newStep);
              } else if (stepAction.action === 'remove') {
                const step = stepsByName.get(stepAction.name) as IFlowStep &
                  ISaved;
                await ops.flowStep.delete(step);
              }
            }
            return newSteps;
          },
        )(flow);
        const steps = ops.entity.toCollection(stepsIt);
        const order = stepsIt.map(({ id }) => id);
        const updateProps: IFlowUpdateProps = {
          name: flowEdition.name,
          steps,
          order,
        };
        if ('description' in flowEdition) {
          updateProps.description = flowEdition.description;
        }
        if ('default' in flowEdition) {
          updateProps.defaultStepId = stepsIt.filter(
            ({ name }) => name === flowEdition.default,
          )[0]?.id;
        }
        return ops.flow.update(updateProps)(flow);
      };
  }

  public get toFlowEdition() {
    return (
      flow: IFlow,
      {
        defaultAction = 'keep',
      }: { defaultAction?: TFlowStepEditionActions } = {},
    ): IFlowEdition => {
      const data: IFlowEdition = {
        name: flow.name,
        steps: flow.order
          .map((flowStepId) => flow.steps.get(flowStepId) as IFlowStep & ISaved)
          .map(({ name, color, description }) => {
            const data: TFlowStepEditionAction = {
              action: defaultAction,
              name,
            };
            if (color !== undefined) {
              data.color = color;
            }
            if (description !== undefined) {
              data.description = description;
            }
            return data;
          }),
      };
      if (flow.description !== undefined) {
        data.description = flow.description;
      }
      if (flow.defaultStepId !== undefined) {
        data.default = flow.steps.get(flow.defaultStepId)?.name;
      }
      return data;
    };
  }

  public get editFlow() {
    const editInEditor = this.editInEditor.bind(this);
    const toFlowEdition = this.toFlowEdition.bind(this);
    return async ({
      default: defaultValue = { name: '' },
    }: {
      default?: IFlowEdition | IFlow;
    }): Promise<IFlowEdition> => {
      defaultValue = isFlow(defaultValue)
        ? toFlowEdition(defaultValue)
        : defaultValue;
      const defaultText = YAML.stringify(defaultValue, {
        blockQuote: 'literal',
      });
      const text = await editInEditor({
        default: defaultText,
        postfix: '.yml',
      });
      const data = YAML.parse(text);
      if (!isFlowEdition(data)) {
        throw new ParserError('Invalid edited flow');
      }
      return data;
    };
  }
}

export type TEditionOperators = EditionOperators;
