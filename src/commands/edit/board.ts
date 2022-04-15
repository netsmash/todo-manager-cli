import { EditionCancelException } from '../../errors';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TEditBoardArgs = [string];
interface IEditBoardOps {
  name?: string;
}
export const editBoard = commandAction<TEditBoardArgs, IEditBoardOps>(
  async ({ args: [boardSelector], options: { name } }) => {
    const ops = await getOperators();
    const board = await ops.board.getOrFailByRegExp(boardSelector);

    let nameDescription: { name: string; description?: string };
    if (name === undefined) {
      try {
        nameDescription = await ops.edition.editNameDescription({
          default: {
            name: board.name,
            description: board.description,
          },
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
    await asyncPipe(
      ops.board.update(nameDescription),
      ops.board.save,
      (board) => ops.terminal.out(`${String(board.id)}`),
    )(board);
  },
);
