import { injectable } from 'inversify';
import * as readline from 'node:readline';

@injectable()
export class TerminalOperators {
  public get out() {
    return (text: string) => {
      process.stdout.write(text);
    };
  }

  public get ask() {
    return (text?: string) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise<string>((resolve) => {
        rl.question(text || '', (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    };
  }

  public get askYesNo() {
    const ask = this.ask.bind(this);
    const out = this.out.bind(this);
    return async (text?: string, defaultAnswer?: boolean) => {
      text =
        (text || '') +
        ' ' +
        (defaultAnswer === undefined
          ? '[y/n]'
          : defaultAnswer
          ? '[Y/n]'
          : '[y/N]') +
        ' ';
      let answer: boolean | undefined = undefined;
      while (answer === undefined) {
        const answerStr = (await ask(text)).trim().toLowerCase();
        if (answerStr === 'y') {
          answer = true;
        } else if (answerStr === 'n') {
          answer = false;
        } else if (defaultAnswer !== undefined && answerStr === '') {
          answer = defaultAnswer;
        } else {
          out(`Response '${answerStr}' is not one of {'y', 'n'}\n`);
        }
      }
      return answer;
    };
  }
}

export type TTerminalOperators = TerminalOperators;
