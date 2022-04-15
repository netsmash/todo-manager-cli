import { EntityType } from 'todo-manager';
import { CliError } from './base';

export class SerializerError extends CliError {
  constructor(type: EntityType, message?: string) {
    let parsedMessage = `Serializing ${type} Error`;
    if (message) {
      parsedMessage += `: ${message}`;
    }
    super(parsedMessage);
    Object.setPrototypeOf(this, SerializerError.prototype);
  }
}

export class DeserializerError extends CliError {
  constructor(message?: string) {
    let parsedMessage = `Deserializing Error`;
    if (message) {
      parsedMessage += `: ${message}`;
    }
    super(parsedMessage);
    Object.setPrototypeOf(this, DeserializerError.prototype);
  }
}
