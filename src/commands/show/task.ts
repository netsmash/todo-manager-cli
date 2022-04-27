import { ITaskFilters } from '../../models';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowTaskArgs = [string | undefined];
interface IShowTaskOps {
  filter?: string;
  board?: string;
  steps?: string[];
  quiet?: boolean;
}
export const showTask = commandAction<TShowTaskArgs, IShowTaskOps>(
  async ({
    args: [taskId],
    options: {
      filter,
      board: boardSelector,
      steps: stepsSelector,
      quiet: showOnlyIds = false,
    },
  }) => {
    const ops = await getOperators();

    if (taskId !== undefined) {
      return showTaskDetail(taskId, { quiet: showOnlyIds });
    }
    const taskFilters: ITaskFilters = {};

    if (boardSelector !== undefined) {
      taskFilters.board = await ops.board.getOrFailByRegExp(boardSelector);
    }
    if (stepsSelector !== undefined) {
      taskFilters.steps = new Map();
      for (const stepSelector of stepsSelector) {
        const flowStepCollection = await ops.flowStep.getCollectionByRegExp(
          stepSelector,
        );
        if (taskFilters.steps === undefined) {
          taskFilters.steps = flowStepCollection;
        } else {
          taskFilters.steps = ops.entity.mergeCollections([
            taskFilters.steps,
            flowStepCollection,
          ]);
        }
      }
    }
    if (filter !== undefined) {
      taskFilters.regexp = filter;
    }

    const parseTasks = asyncPipe(
      ops.task.getCollectionWithFilters,
      showOnlyIds
        ? ops.parsing.entity.collectionIds
        : ops.parsing.task.collection,
    );
    ops.terminal.out(await parseTasks(taskFilters));
  },
);

interface IShowTaskDetailOps {
  quiet?: boolean;
}
const showTaskDetail = async (
  regex: string,
  { quiet: showOnlyId = false }: IShowTaskDetailOps = {},
) => {
  const ops = await getOperators();
  const task = await ops.task.getOrFailByRegExp(regex);
  ops.terminal.out(
    showOnlyId
      ? await ops.parsing.entity.id(task)
      : await ops.parsing.task.detail(task),
  );
};
