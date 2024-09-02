import { Store } from 'simorg-store';
import type {
  StorageGroup,
  StorageGroupFunctions,
  StorageItem,
  StorageVersioningJSON,
} from './old-types';

//
//

export function storageGroup<T extends StorageGroup>(
  group: T,
): T & StorageGroupFunctions {
  //
  //

  function listen() {
    function onStorage(event: StorageEvent) {
      if (group[event.key as any]) {
        group[event.key as any].load();
      }
    }

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }

  //
  //

  function load() {
    Object.keys(group).forEach((key) => {
      group[key].load();
    });
  }

  //
  //

  const functions: StorageGroupFunctions = {
    listen,
    load,
  };

  //
  //

  Object.setPrototypeOf(group, functions);

  //
  //

  return group as any;
}

/**
 * Create a versioned storage
 * @param key the key to store the data
 * @returns a StorageItem object
 */
export function storageItem<T>(key: string): StorageItem<T>;

/**
 * Create a versioned storage
 * @param key the key to store the data
 * @param version the version of the data
 * @returns a StorageItem object
 */
export function storageItem<T>(
  key: string,
  version: string | number,
): StorageItem<T>;

/**
 * Create a versioned storage
 * @param key the key to store the data
 * @param validation a function to validate the data
 * @returns a StorageItem object
 */
export function storageItem<T>(
  key: string,
  validation: (value: any) => T,
): StorageItem<T>;

//
//

export function storageItem<T>(
  key: string,
  version?: string | number | ((value: any) => T),
): StorageItem<T> {
  let timeout: any = null;
  const signal = new Store(null);

  //
  //

  function setValue(newValue: any) {
    signal.set(newValue);
    return newValue;
  }

  //
  //

  function load() {
    clearTimeout(timeout);

    try {
      const strItem = localStorage.getItem(key);
      if (!strItem) return null;

      const parsed: StorageVersioningJSON<T> = JSON.parse(strItem);

      if (typeof version === 'function') {
        parsed.data = version(parsed.data);
      } else {
        if (parsed.v !== version) {
          return setValue(null);
        }
      }

      if (parsed.exp) {
        const now = new Date().getTime();
        const diff = parsed.exp - now;
        if (diff > 0) {
          timeout = setTimeout(() => setValue(null), diff);
        } else {
          return setValue(null);
        }
      }

      return setValue(parsed.data);
    } catch (error) {
      console.error('[Error loading localStorage]', error);
    }

    return setValue(null);
  }

  //
  //

  function save(data: T | null, exp?: Date) {
    clearTimeout(timeout);

    if (data !== null && data !== undefined) {
      const dataToSave: StorageVersioningJSON<T> = {
        data,
      };

      if (typeof version === 'function') {
        dataToSave.data = version(data);
      } else if (version) {
        dataToSave.v = version;
      }

      if (exp) {
        dataToSave.exp = exp.getTime();
        const now = new Date().getTime();
        const diff = dataToSave.exp - now;

        if (diff > 0) {
          timeout = setTimeout(() => setValue(null), diff);
        }
      }

      localStorage.setItem(key, JSON.stringify(dataToSave));
      setValue(data);
    } else {
      localStorage.removeItem(key);
      setValue(null);
    }
  }

  //
  //

  return {
    load,
    save,
    get: signal.get.bind(signal),
    subscribe: signal.subscribe.bind(signal),
  };
}

/**
 * Same api as storageItem but for testing
 *
 * Does not expire the data neither access the localStorage
 */
export function storageItemTesting<T>(): StorageItem<T> {
  const signal = new Store(null);

  //
  //

  function save(data: T | null) {
    if (data !== null && data !== undefined) {
      signal.set(data as any);
    } else {
      signal.set(null);
    }
  }

  const get = signal.get.bind(signal);

  //
  //

  return {
    load: get,
    save,
    get,
    subscribe: signal.subscribe.bind(signal),
  };
}
