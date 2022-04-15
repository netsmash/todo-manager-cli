import {
  EntityCollection,
  Id,
  ISaved,
  IFlow,
  IBoard,
  ITask,
  IFlowStep,
} from 'todo-manager';
import { getOperators } from '../../inversify.config';
import {
  asyncMap,
  asyncPipe,
  asyncQueuedMap,
  asyncTap,
  commandAction,
} from '../../lib';
import { CliError } from '../../errors';

type DeletingCollections = [
  EntityCollection<IFlow & ISaved>,
  EntityCollection<IBoard & ISaved>,
  EntityCollection<ITask & ISaved>,
  EntityCollection<IFlowStep & ISaved>,
];

type TRemoveFlowArgs = [string[]];
interface IRemoveFlowOps {
  confirm?: boolean;
  boards?: boolean;
  recursive?: boolean;
}
export const removeFlow = commandAction<TRemoveFlowArgs, IRemoveFlowOps>(
  async ({
    args: [flowSelectors],
    options: {
      confirm: deleteConfirmed = false,
      boards: deleteBoardsFlag = false,
      recursive: deleteRecursive = false,
    },
  }) => {
    const ops = await getOperators();

    const askConfirmDelete = async ([
      flowCollection,
      boardCollection,
      taskCollection,
      flowStepCollection,
    ]: DeletingCollections) => {
      if (flowCollection.size === 0) {
        return false;
      }
      const flowCollectionStr = await ops.parsing.flow.collection(
        flowCollection,
      );

      // flow steps
      let flowStepStr = ``;
      flowStepStr = `Also ${flowStepCollection.size} steps are going to be deleted.\n`;

      // boards
      let boardStr = ``;
      if (deleteBoardsFlag && boardCollection.size > 0) {
        const boardCollectionStr = await ops.parsing.board.collection(
          boardCollection,
        );
        boardStr =
          `Also the following ${boardCollection.size} boards are going to be deleted:` +
          `\n\n${boardCollectionStr}\n`;
      }

      // tasks
      let taskStr = ``;
      if (deleteBoardsFlag && deleteRecursive && taskCollection.size > 0) {
        const taskCollectionStr = await ops.parsing.task.collection(
          taskCollection,
        );
        taskStr =
          `Also the following ${taskCollection.size} tasks are going to be deleted:` +
          `\n\n${taskCollectionStr}\n`;
      }
      return await ops.terminal.askYesNo(
        `The following ${boardCollection.size} boards are going to be deleted:` +
          `\n\n${flowCollectionStr}\n` +
          `\n${flowStepStr}\n` +
          `\n${boardStr}` +
          `\n${taskStr}` +
          `\nDo you want to proceed?`,
        false,
      );
    };

    const ensureDelete = async (
      collections: DeletingCollections,
    ): Promise<DeletingCollections> =>
      deleteConfirmed || (await askConfirmDelete(collections))
        ? collections
        : [new Map(), new Map(), new Map(), new Map()];

    const deleteTasks = (taskCollection: EntityCollection<ITask & ISaved>) =>
      asyncPipe(
        () => taskCollection.values(),
        asyncQueuedMap(ops.task.delete),
      )();

    const deleteBoards = (boardCollection: EntityCollection<IBoard & ISaved>) =>
      asyncPipe(
        () => boardCollection.values(),
        asyncQueuedMap(ops.board.delete),
      )();

    const deleteFlowSteps = (
      flowStepCollection: EntityCollection<IFlowStep & ISaved>,
    ) =>
      asyncPipe(
        (flowStepCollection: EntityCollection<IFlowStep & ISaved>) =>
          flowStepCollection.values(),
        asyncQueuedMap(ops.flowStep.delete),
      )(flowStepCollection);

    const deleteFlows = (flowCollection: EntityCollection<IFlow & ISaved>) =>
      asyncPipe(
        (flowCollection: EntityCollection<IFlow & ISaved>) =>
          flowCollection.values(),
        asyncQueuedMap(ops.flow.delete),
        asyncQueuedMap(ops.flow.getSteps),
        ops.entity.mergeCollections,
        (flowStepCollection: EntityCollection<IFlowStep & ISaved>) =>
          flowStepCollection.values(),
        asyncQueuedMap(ops.flowStep.delete),
      )(flowCollection);

    await asyncPipe(
      asyncMap((regexp: string) => ops.flow.getCollectionByRegExp(regexp)),
      ops.entity.mergeCollections,
      async (
        flowCollection: EntityCollection<IFlow & ISaved>,
      ): Promise<DeletingCollections> => {
        const flowStepCollection = await asyncPipe(
          (flowCollection: EntityCollection<IFlow & ISaved>) =>
            flowCollection.values(),
          asyncQueuedMap(ops.flow.getSteps),
          ops.entity.mergeCollections,
        )(flowCollection);

        const boardCollection = await asyncPipe(
          (flowCollection: EntityCollection<IFlow & ISaved>) =>
            flowCollection.values(),
          asyncQueuedMap(ops.flow.getBoards),
          ops.entity.mergeCollections,
        )(flowCollection);

        if (!deleteBoardsFlag) {
          if (boardCollection.size > 0) {
            throw new CliError(
              `Trying to delete flows with associated ${boardCollection.size} boards.` +
                `\nIf you want to remove also the boards, for security, use option \`--boards\`.`,
            );
          }
          return [flowCollection, new Map(), new Map(), flowStepCollection];
        }
        if (!deleteRecursive) {
          return [
            flowCollection,
            boardCollection,
            new Map(),
            flowStepCollection,
          ];
        }
        const taskCollection = await asyncPipe(
          (boardCollection: EntityCollection<IBoard & ISaved>) =>
            boardCollection.values(),
          asyncQueuedMap((board) => board.tasks),
          ops.entity.mergeCollections,
        )(boardCollection);
        return [
          flowCollection,
          boardCollection,
          taskCollection,
          flowStepCollection,
        ];
      },
      ensureDelete,
      // delete tasks
      asyncTap(([_, _2, taskCollection]: DeletingCollections) =>
        deleteTasks(taskCollection),
      ),
      // delete boards
      asyncTap(([_, boardCollection]: DeletingCollections) =>
        deleteBoards(boardCollection),
      ),
      // delete flowSteps
      asyncTap(([_, _2, _3, flowStepCollection]: DeletingCollections) =>
        deleteFlowSteps(flowStepCollection),
      ),
      // delete flows
      asyncTap(([flowCollection]: DeletingCollections) =>
        deleteFlows(flowCollection),
      ),
      // output ids
      ([
        flowCollection,
        boardCollection,
        taskCollection,
        flowStepCollection,
      ]: DeletingCollections): Id[] => [
        ...Array.from(flowCollection.keys()),
        ...Array.from(flowStepCollection.keys()),
        ...Array.from(boardCollection.keys()),
        ...Array.from(taskCollection.keys()),
      ],
      (ids: Id[]) => ids.join('\n'),
      ops.terminal.out,
    )(flowSelectors);
  },
);
