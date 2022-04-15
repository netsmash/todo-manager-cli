import {
  EntityType,
  IBoard,
  BoardOperators as BoardOperatorsBase,
} from 'todo-manager';

export class BoardOperators extends BoardOperatorsBase {
  public get getOrFailByRegExp() {
    return this.entity.getOrFailByRegExp<IBoard>(EntityType.Board);
  }

  public get getCollectionByRegExp() {
    return this.entity.getCollectionByRegExp<IBoard>(EntityType.Board);
  }
}

export type TBoardOperators = BoardOperators;
