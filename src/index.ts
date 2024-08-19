import { type ReadableSignal, signalFactory } from 'signal-factory';

//
//

export interface StorageItem<T> extends ReadableSignal<T | null> {
  /**
   * Load the data from the localStorage
   *
   * If the data is expired, it will return null
   *
   * If the version is different, it will return null
   *
   * @returns the data or null
   */
  load: () => T | null;

  /**
   * Save the data to the localStorage
   *
   * If the expiration date is set, the data will be removed after the expiration date
   *
   * If data is null, the data will be removed
   *
   * @param data the data to save
   * @param exp the expiration date
   */
  save: (data: T | null, exp?: Date) => void;

  /**
   * The current value of the storage
   */
  get: () => T | null;

  /**
   * Subscribe to the storage changes is the same method of the signal
   *
   * @param callback the callback to be called when the storage changes
   * @returns a function to unsubscribe
   */
  subscribe: (callback: (value: T | null) => void) => () => void;
}

//
//

export type StorageVersioningJSON<T> = {
  data: T;
  v?: string | number;
  exp?: number;
};

//
//

export type StorageGroup = {
  [key: string]: StorageItem<any>;
};

//
//

export type StorageGroupFunctions = {
  /**
   * Add the event listener to listen the window storage event
   * @returns a function to remove the event listener
   */
  listen: () => () => void;

  /**
   * Load all the data from the localStorage
   */
  load: () => void;
};

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
  const signal = signalFactory<T | null>(null);

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
  const signal = signalFactory<T | null>(null);

  //
  //

  function save(data: T | null) {
    if (data !== null && data !== undefined) {
      signal.set(data);
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
