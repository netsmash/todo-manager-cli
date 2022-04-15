import { CliError } from './base';

export class EditionCancelException extends CliError {
  constructor(message?: string) {
    let parsedMessage = `Edition Canceled Exception`;
    if (message) {
      parsedMessage += `: ${message}`;
    }
    super(parsedMessage);
    Object.setPrototypeOf(this, EditionCancelException.prototype);
  }
}
