import { EntityType, Id } from 'todo-manager';

export interface IEntityFileSource {
  id: Id;
  type: EntityType;
  createdAt: number;
  updatedAt?: number;
  name: string;
  description?: string;
}
