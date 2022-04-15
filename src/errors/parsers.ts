import { CliError } from './base';

export class ParserError extends CliError {
  constructor(message?: string) {
    let parsedMessage = `Parser Error`;
    if (message) {
      parsedMessage += `: ${message}`;
    }
    super(parsedMessage);
    Object.setPrototypeOf(this, ParserError.prototype);
  }
}
