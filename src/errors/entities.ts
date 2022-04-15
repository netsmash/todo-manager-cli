import { EntityType, Id } from 'todo-manager';
import { CliError } from './base';

export class EntityAlreadyExistError extends CliError {
  constructor(type: EntityType, id: Id) {
    const message = `${type} with expression \`${String(id)}\` already exists.`;
    super(message);
    Object.setPrototypeOf(this, EntityDoesNotExistError.prototype);
  }
}

export class EntityDoesNotExistError extends CliError {
  constructor(type: EntityType, id: Id) {
    const message = `${type} with expression \`${String(
      id,
    )}\` does not exists.`;
    super(message);
    Object.setPrototypeOf(this, EntityDoesNotExistError.prototype);
  }
}

export class TaskDoesNotExistError extends EntityDoesNotExistError {
  constructor(id: Id) {
    super(EntityType.Task, id);
    Object.setPrototypeOf(this, TaskDoesNotExistError.prototype);
  }
}

export class BoardDoesNotExistError extends EntityDoesNotExistError {
  constructor(id: Id) {
    super(EntityType.Board, id);
    Object.setPrototypeOf(this, BoardDoesNotExistError.prototype);
  }
}

export class FlowStepDoesNotExistError extends EntityDoesNotExistError {
  constructor(id: Id) {
    super(EntityType.FlowStep, id);
    Object.setPrototypeOf(this, FlowStepDoesNotExistError.prototype);
  }
}

export class FlowDoesNotExistError extends EntityDoesNotExistError {
  constructor(id: Id) {
    super(EntityType.Flow, id);
    Object.setPrototypeOf(this, FlowDoesNotExistError.prototype);
  }
}

export class EntityIsNotUniqueError extends CliError {
  constructor(type: EntityType, expression: string) {
    const message = `There are several ${type} matching expression \`${expression}\`.`;
    super(message);
    Object.setPrototypeOf(this, EntityIsNotUniqueError.prototype);
  }
}

export class TaskIsNotUniqueError extends EntityIsNotUniqueError {
  constructor(expression: string) {
    super(EntityType.Task, expression);
    Object.setPrototypeOf(this, TaskIsNotUniqueError.prototype);
  }
}

export class BoardIsNotUniqueError extends EntityIsNotUniqueError {
  constructor(expression: string) {
    super(EntityType.Board, expression);
    Object.setPrototypeOf(this, BoardIsNotUniqueError.prototype);
  }
}

export class FlowStepIsNotUniqueError extends EntityIsNotUniqueError {
  constructor(expression: string) {
    super(EntityType.FlowStep, expression);
    Object.setPrototypeOf(this, FlowStepIsNotUniqueError.prototype);
  }
}

export class FlowIsNotUniqueError extends EntityIsNotUniqueError {
  constructor(expression: string) {
    super(EntityType.Flow, expression);
    Object.setPrototypeOf(this, FlowIsNotUniqueError.prototype);
  }
}
