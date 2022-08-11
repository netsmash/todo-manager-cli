import { injectable } from 'inversify';
import { IConfigurationState } from '../../models';
import { TParserConfigurationOperators, ParserConfigurationOperators as Base } from '../../operators/parsing/configuration';
import { IYAMLStorageConfig } from './models';

@injectable()
export class ParserConfigurationOperators extends Base implements TParserConfigurationOperators {

  public override get main() {
    const parentMain = super.main;
    return async (state: IConfigurationState) => {
      let result = await parentMain(state);
      result += `\n\n` + (await this.parseStorage(state));
      return result;
    };
  }

  public get parseStorage() {
    const fileName = this.base.setColor(this.fileNameColor);
    const setColor = this.base.setColor.bind(this.base);
    const parseTitle = this.base.parseTitle.bind(this.base);
    return async (state: IConfigurationState): Promise<string> => {
      const remark = setColor(`blueBright`);
      let result = ``;
      result += await parseTitle({})('Storage');
      const storage = state['storage'] as IYAMLStorageConfig;
      result += `\nEntities ${remark('stored locally')} using ${remark(
        'YAML',
      )}`;
      result += ` at folder ${fileName(storage.path)} .`;
      return result;
    };
  }

}

