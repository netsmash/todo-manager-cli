import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowBoardArgs = [string | undefined];
interface IShowBoardOps {
  filter?: string;
  quiet?: boolean;
}
export const showBoard = commandAction<TShowBoardArgs, IShowBoardOps>(
  async ({
    args: [boardId],
    options: { filter, quiet: showOnlyIds = false },
  }) => {
    const ops = await getOperators();

    if (boardId !== undefined) {
      return showBoardDetail(boardId, { quiet: showOnlyIds });
    }

    const getBoards = async () => {
      if (filter !== undefined) {
        return await ops.board.getCollectionByRegExp(filter);
      }
      return ops.board.list();
    };

    const parseBoards = asyncPipe(
      getBoards,
      showOnlyIds
        ? ops.parsing.entity.collectionIds
        : ops.parsing.board.collection,
    );
    ops.terminal.out(await parseBoards());
  },
);

interface IShowBoardDetailOps {
  quiet?: boolean;
}
const showBoardDetail = async (
  regex: string,
  { quiet: showOnlyId = false }: IShowBoardDetailOps = {},
) => {
  const ops = await getOperators();
  const board = await ops.board.getOrFailByRegExp(regex);
  ops.terminal.out(
    showOnlyId
      ? await ops.parsing.entity.id(board)
      : await ops.parsing.board.detail(board),
  );
};
