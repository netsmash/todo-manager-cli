export class CliError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, CliError.prototype);
  }
}
