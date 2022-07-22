import { inject, injectable } from 'inversify';
import { IConfigurationState } from '../../models';
//import { StringUtils } from '../../lib';
import { Identificators } from '../../identificators';
import { TConfigurationOperators } from '../configuration';
import { TParserBaseOperators } from './base';
import { ParsingIdentificators } from './identificators';
import { TLoggingOperators } from '../logging';
import { TFlowStepColor } from 'todo-manager';

@injectable()
export class ParserConfigurationOperators {
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.LoggingOperators)
    protected logging: TLoggingOperators,
    @inject(ParsingIdentificators.Base)
    protected base: TParserBaseOperators,
  ) {}

  protected hrChar = '─';
  protected titleColor: TFlowStepColor = 'whiteBright';
  protected fileNameColor: TFlowStepColor = 'green';

  public get main() {
    const logging = this.logging;
    const fileNameColor = this.fileNameColor;
    const setColor = this.base.setColor.bind(this.base);
    const parseTitle = this.base.parseTitle.bind(this.base);
    const parseView = this.parseView.bind(this);
    const config = this.config;
    return logging.logAsyncOperation('ParserConfiguration.main()')(
      async (state: IConfigurationState) => {
        let result = ``;
        result += await parseTitle({})('Configuration Files');
        result += `\nMain file at ${setColor(fileNameColor)(
          config.filePath,
        )} .`;
        if (state.files.length > 1) {
          result += `\nFollowing files could partially override configuration:`;
          for (const filePath of state.files) {
            if (filePath !== config.filePath) {
              result += `\n  - ${setColor(fileNameColor)(filePath)}`;
            }
          }
        }
        result += `\n\n` + (await parseView(state));
        return result;
      },
    );
  }

  protected get parseView() {
    const setColor = this.base.setColor.bind(this.base);
    const parseTitle = this.base.parseTitle.bind(this.base);
    return async (state: IConfigurationState): Promise<string> => {
      const remark = setColor(`blueBright`);
      const deny = setColor(`redBright`);
      let result = ``;
      result += await parseTitle({})('View Options');
      result += `\nColor ${
        state.view.allowColor ? remark('is') : deny('is not')
      } allowed.`;
      return result;
    };
  }
}

export interface TParserConfigurationOperators {
  main: (state: IConfigurationState) => Promise<string>;
};
