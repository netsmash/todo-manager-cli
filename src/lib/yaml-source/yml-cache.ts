import YAML from 'yaml';
import { writeFile, readFile } from 'node:fs/promises';
import { injectable } from 'inversify';
import { createAsyncQueue } from '../../lib';

interface ICacheInfo {
  lastWrite: number;
  lastRead: number;
  fileReads: number;
  fileWrites: number;
  cacheReads: number;
}

@injectable()
export class YAMLCacheOperators {
  protected asyncQueue = createAsyncQueue();

  public readonly yamlWriteOptions: YAML.DocumentOptions &
    YAML.ParseOptions &
    YAML.CreateNodeOptions &
    YAML.ToStringOptions = {
    blockQuote: 'literal',
  };
  public readonly yamlReadOptions: YAML.ToJSOptions = {
    mapAsMap: false,
  };

  protected _cache: Map<string, any> = new Map();
  protected _cacheInfo: Map<string, ICacheInfo> = new Map();

  public get cache() {
    return this._cache;
  }

  public get cacheInfo() {
    return this._cacheInfo;
  }

  public get getCacheInfo() {
    const cacheInfo = this.cacheInfo;
    return (filePath: string) => {
      if (!cacheInfo.has(filePath)) {
        cacheInfo.set(filePath, {
          lastWrite: 0,
          lastRead: 0,
          fileReads: 0,
          cacheReads: 0,
          fileWrites: 0,
        });
      }
      return cacheInfo.get(filePath) as ICacheInfo;
    };
  }

  public get addFileReadToCacheInfo() {
    const cache = this.cache;
    const cacheInfo = this.cacheInfo;
    const getCacheInfo = this.getCacheInfo.bind(this);
    return (filePath: string) => (value: any) => {
      const info = getCacheInfo(filePath);
      info.fileReads++;
      info.lastRead = Date.now();
      cacheInfo.set(filePath, info);
      cache.set(filePath, value);
    };
  }

  public get addCacheReadToCacheInfo() {
    const cacheInfo = this.cacheInfo;
    const getCacheInfo = this.getCacheInfo.bind(this);
    return (filePath: string) => {
      const info = getCacheInfo(filePath);
      info.cacheReads++;
      cacheInfo.set(filePath, info);
    };
  }

  public get addFileWriteToCacheInfo() {
    const cacheInfo = this.cacheInfo;
    const getCacheInfo = this.getCacheInfo.bind(this);
    return (filePath: string) => {
      const info = getCacheInfo(filePath);
      info.fileWrites++;
      info.lastWrite = Date.now();
      cacheInfo.set(filePath, info);
    };
  }

  public get read() {
    const cache = this.cache;
    const getCacheInfo = this.getCacheInfo.bind(this);
    const addFileReadToCacheInfo = this.addFileReadToCacheInfo.bind(this);
    const addCacheReadToCacheInfo = this.addCacheReadToCacheInfo.bind(this);
    const yamlReadOptions = this.yamlReadOptions;
    return async (filePath: string) => {
      const info = getCacheInfo(filePath);
      if (info.lastRead > info.lastWrite) {
        addCacheReadToCacheInfo(filePath);
        return cache.get(filePath);
      }
      const valueStr = await readFile(filePath, { encoding: 'utf-8' });
      const value = YAML.parse(valueStr, yamlReadOptions) || undefined;
      addFileReadToCacheInfo(filePath)(value);
      return value;
    };
  }

  public get write() {
    const yamlWriteOptions = this.yamlWriteOptions;
    const addFileWriteToCacheInfo = this.addFileWriteToCacheInfo.bind(this);
    return (filePath: string) => async (data: any) => {
      const valueStr = YAML.stringify(data, yamlWriteOptions);
      addFileWriteToCacheInfo(filePath);
      return await writeFile(filePath, valueStr, { encoding: 'utf-8' });
    };
  }
}

export type TYAMLCacheOperators = YAMLCacheOperators;
