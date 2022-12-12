import { VersionConfig, VersionConfigOptions } from './types';

export class VersionManager<T> {
  private config: VersionConfig<T>;

  constructor(config: VersionConfigOptions<T>) {
    this.config = { ...config, current: config.default };
  }

  getDefault(): T {
    return this.config.default;
  }

  getFirst(): T {
    return this.config.min;
  }

  getLatest(): T {
    return this.config.max;
  }

  getCurrent(): T {
    return this.config.current;
  }

  useDefault(): void {
    this.config.current = this.config.default;
  }

  useFirst(): void {
    this.config.current = this.config.min;
  }

  useLatest(): void {
    this.config.current = this.config.max;
  }

  use(version: T): void {
    if (version < this.config.min || version > this.config.max) {
      throw new Error('Unsupported version');
    }

    this.config.current = version;
  }
}
