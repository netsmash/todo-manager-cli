import { ITaskFilters } from '../../models';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowTaskArgs = [string | undefined];
interface IShowTaskOps {
  filter?: string;
  board?: string;
  steps?: string[];
}
export const showTask = commandAction<TShowTaskArgs, IShowTaskOps>(
  async ({
    args: [taskId],
    options: { filter, board: boardSelector, steps: stepsSelector },
  }) => {
    const ops = await getOperators();

    if (taskId !== undefined) {
      return showTaskDetail(taskId);
    }
    const taskFilters: ITaskFilters = {};

    if (boardSelector !== undefined) {
      taskFilters.board = await ops.board.getOrFailByRegExp(boardSelector);
    }
    if (stepsSelector !== undefined) {
      taskFilters.steps = new Map();
      for (const stepSelector of stepsSelector) {
        const flowStep = await ops.flowStep.getOrFailByRegExp(stepSelector);
        taskFilters.steps.set(flowStep.id, flowStep);
      }
    }
    if (filter !== undefined) {
      taskFilters.regexp = filter;
    }

    const parseTasks = asyncPipe(
      () => taskFilters,
      ops.task.getCollectionWithFilters,
      ops.parsing.task.collection,
    );
    ops.terminal.out(await parseTasks());
  },
);

const showTaskDetail = async (regex: string) => {
  const ops = await getOperators();
  const task = await ops.task.getOrFailByRegExp(regex);
  ops.terminal.out(await ops.parsing.task.detail(task));
};
