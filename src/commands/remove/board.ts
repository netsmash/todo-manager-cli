import { EntityCollection, IBoard, Id, ISaved, ITask } from 'todo-manager';
import { getOperators } from '../../inversify.config';
import {
  asyncMap,
  asyncPipe,
  asyncQueuedMap,
  asyncTap,
  commandAction,
} from '../../lib';

type DeletingCollections = [
  EntityCollection<IBoard & ISaved>,
  EntityCollection<ITask & ISaved>,
];

type TRemoveBoardArgs = [string[]];
interface IRemoveBoardOps {
  confirm?: boolean;
  recursive?: boolean;
}
export const removeBoard = commandAction<TRemoveBoardArgs, IRemoveBoardOps>(
  async ({
    args: [boardSelectors],
    options: {
      confirm: deleteConfirmed = false,
      recursive: deleteRecursive = false,
    },
  }) => {
    const ops = await getOperators();

    const askConfirmDelete = async ([
      boardCollection,
      taskCollection,
    ]: DeletingCollections) => {
      if (boardCollection.size === 0) {
        return false;
      }
      const boardCollectionStr = await ops.parsing.board.collection(
        boardCollection,
      );
      let taskStr = ``;
      if (deleteRecursive && taskCollection.size > 0) {
        const taskCollectionStr = await ops.parsing.task.collection(
          taskCollection,
        );
        taskStr =
          `Also the following ${taskCollection.size} tasks are going to be deleted:` +
          `\n\n${taskCollectionStr}\n`;
      }
      return await ops.terminal.askYesNo(
        `The following ${boardCollection.size} boards are going to be deleted:` +
          `\n\n${boardCollectionStr}\n` +
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
        : [new Map(), new Map()];

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

    await asyncPipe(
      asyncMap((regexp: string) => ops.board.getCollectionByRegExp(regexp)),
      ops.entity.mergeCollections,
      async (
        boardCollection: EntityCollection<IBoard & ISaved>,
      ): Promise<DeletingCollections> => {
        if (!deleteRecursive) {
          return [boardCollection, new Map()];
        }
        const taskCollections = Array.from(boardCollection.values()).map(
          (board) => board.tasks,
        );
        const taskCollection = ops.entity.mergeCollections(taskCollections);
        return [boardCollection, taskCollection];
      },
      ensureDelete,
      // delete tasks
      asyncTap(([_, taskCollection]: DeletingCollections) =>
        deleteTasks(taskCollection),
      ),
      // delete boards
      asyncTap(([boardCollection]: DeletingCollections) =>
        deleteBoards(boardCollection),
      ),
      // output ids
      ([boardCollection, taskCollection]: DeletingCollections): Id[] => [
        ...Array.from(boardCollection.keys()),
        ...Array.from(taskCollection.keys()),
      ],
      (ids: Id[]) => ids.join('\n'),
      ops.terminal.out,
    )(boardSelectors);
  },
);
