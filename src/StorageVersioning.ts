import { Store } from 'signal-factory/store';
import { StorageVersioningJSON } from './types';

//
//

export type StorageItems = {
  [key: string]: any;
};

export type StorageVersions<T extends StorageItems> = {
  [key: string]: string | number | ((value: any) => T[keyof T]);
};

//
//

export class StorageVersioning<T extends StorageItems> extends Store<T> {
  /**
   * @internal
   */
  _timeouts: Record<string, any> = {};

  /**
   * Create a versioned storage
   * @param initial The initial value of the storage
   * @param versioning The versioning variable, if it is a function, it will be called with the data to return the new data
   * @param noLocalStorage If true, the localStorage will not be used
   */
  constructor(
    readonly versioning: StorageVersions<T>,
    initial: T = {} as any,
    noLocalStorage = false,
  ) {
    super(initial);

    //

    if (noLocalStorage) {
      //
      // Rewrite the save method
      this.save = (key, data): void => {
        if (data !== null && data !== undefined) {
          this._setValue(key, data);
        } else {
          this._setValue(key, data);
        }
      };

      //
      // Rewrite the load method
      this.load = (key): any => {
        return this.get()[key];
      };

      //
      // Rewrite the listen method
      this.listen = () => () => {};
    }
  }

  /**
   * Load the data from the localStorage
   *
   * If the data is expired, it will return null
   *
   * If the version is different, it will return null
   *
   * @param key the key to load
   * @returns the data related to that key or null
   */
  load<K extends keyof T>(key: K): T[K] | null {
    clearTimeout(this._timeouts[key as string]);

    try {
      const strItem = localStorage.getItem(key as string);
      if (!strItem) return null;

      //

      const parsed: StorageVersioningJSON<T> = JSON.parse(strItem);

      //

      const versioning = this.versioning[key as string] as any;

      if (typeof versioning === 'function') {
        parsed.data = versioning(parsed.data);
      } else {
        if (parsed.v !== versioning) {
          return this._setValue(key, null);
        }
      }

      //

      if (parsed.exp) {
        const now = new Date().getTime();
        const diff = parsed.exp - now;

        //

        if (diff > 0) {
          this._timeouts[key as string] = setTimeout(() => {
            this._setValue(key, null);
          }, diff);
        } else {
          return this._setValue(key, null);
        }
      }

      return this._setValue(key, parsed.data as any);
    } catch (error) {
      console.error(`[Error loading localStorage for ${key as string}]`, error);
    }

    return this._setValue(key, null);
  }

  /**
   * Save the data to the localStorage
   *
   * If the expiration date is set, the data will be removed after the expiration date
   *
   * If data is null, the data will be removed
   *
   * @param key the key to save
   * @param data the data to save
   * @param exp the expiration date
   */
  save<K extends keyof T>(key: K, data: T[K], exp?: Date): void {
    clearTimeout(this._timeouts[key as string]);

    //
    //

    if (data !== null && data !== undefined) {
      const dataToSave: StorageVersioningJSON<T> = {
        data,
      };

      //
      const versioning = this.versioning[key as string] as any;

      if (versioning) {
        if (typeof versioning === 'function') {
          dataToSave.data = versioning(data);
        } else {
          dataToSave.v = versioning;
        }
      }

      //

      if (exp) {
        dataToSave.exp = exp.getTime();
        const now = new Date().getTime();
        const diff = dataToSave.exp - now;

        if (diff > 0) {
          this._timeouts[key as string] = setTimeout(() => {
            this._setValue(key, null);
          }, diff);
        }
      }

      localStorage.setItem(key as string, JSON.stringify(dataToSave));
      this._setValue(key, data);
    } else {
      localStorage.removeItem(key as string);
      this._setValue(key, null);
    }
  }

  //
  //

  /**
   * @internal
   */
  _setValue<K extends keyof T>(key: K, data: T[K] | null): T[K] | null {
    // @ts-ignore
    const value = this.get();
    if (value[key] === data) return data;

    this.set({ ...value, [key]: data });
    return data;
  }

  /**
   * Add the event listener to listen the window storage event
   * @returns a function to remove the event listener
   */
  listen(): () => void {
    const onStorage = (event: StorageEvent) => {
      if ((event.key as string) in this.versioning) {
        this.load(event.key as any);
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }
}
