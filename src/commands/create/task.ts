import { IBoard, IFlow, IFlowStep, ISaved } from 'todo-manager';
import { CliError, EditionCancelException } from '../../errors';
import { getOperators } from '../../inversify.config';
import { asyncPipe, asyncTap, commandAction } from '../../lib';
import newTaskTemplate from '../../templates/new-task.json';

type TCreateTaskArgs = [string | undefined];
interface ICreateTaskOps {
  board?: string;
  step?: string;
  name?: string;
}
export const createTask = commandAction<TCreateTaskArgs, ICreateTaskOps>(
  async ({
    args: [taskId],
    options: { board: boardSelector, step: stepSelector, name },
  }) => {
    const ops = await getOperators();

    let board: (IBoard & ISaved) | undefined = undefined;
    if (boardSelector !== undefined) {
      board = await ops.board.getOrFailByRegExp(boardSelector);
    }

    let flowStep: IFlowStep | undefined = undefined;
    if (stepSelector === undefined && board === undefined) {
      // do nothing
    } else if (stepSelector === undefined && board !== undefined) {
      const flow = board.flow as IFlow & ISaved;
      if (flow.defaultStepId) {
        flowStep = await ops.flowStep.getOrFail(flow.defaultStepId);
      } else {
        throw new CliError(
          'Selected board without a default step and step not provided.',
        );
      }
    } else if (board === undefined) {
      throw new CliError('Step is selected but not board is selected.');
    } else {
      const flow = board.flow as IFlow & ISaved;
      flowStep = await ops.flowStep.getOrFailWithFilters({
        regexp: stepSelector,
        flow,
      });
    }

    let nameDescription: { name: string; description?: string };
    if (name === undefined) {
      try {
        nameDescription = await ops.edition.editNameDescription({
          default: newTaskTemplate,
        });
      } catch (error: any) {
        if (error instanceof EditionCancelException) {
          return;
        } else {
          throw error;
        }
      }
    } else {
      nameDescription = { name };
    }

    const createTask = asyncPipe(
      ops.task.create,
      asyncTap(async (task) => {
        if (board !== undefined) {
          await asyncPipe(
            () => board as IBoard & ISaved,
            ops.board.addTask(task),
            flowStep !== undefined
              ? ops.board.setTaskStep(flowStep as IFlowStep & ISaved)(task)
              : async (board) => board,
            ops.board.save,
          )();
        }
      }),
    );
    const task = await createTask({ id: taskId, ...nameDescription });
    ops.terminal.out(`${String(task.id)}`);
  },
);
