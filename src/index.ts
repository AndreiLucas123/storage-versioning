//
//

export type StorageVersioning<T> = {
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
  value: T | null;
};

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
  [key: string]: StorageVersioning<any>;
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

export type StorageSignal = {
  value: any;
};

//
//

let signalFactory: () => StorageSignal = () => {
  throw new Error('Signal factory not set');
};

//
//

export function setSignalFactory(factory: () => StorageSignal) {
  signalFactory = factory;
}

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
 * @param version the version of the data
 * @param onUpdate callback to call when the data is updated by window storage event
 * @returns a StorageVersioning object
 */
export function storageVersioning<T>(
  key: string,
  version?: string | number,
): StorageVersioning<T> {
  let timeout: any = null;
  const signal = signalFactory();

  //
  //

  function setValue(newValue: any) {
    signal.value = newValue;
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

      if (parsed.v !== version) {
        return setValue(null);
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
      console.error('[Error reading localStorage]', error);
    }

    return setValue(null);
  }

  //
  //

  function save(data: T | null, exp?: Date) {
    clearTimeout(timeout);

    if (data !== null && data !== undefined) {
      const dataToSave: StorageVersioningJSON<T> = {
        v: version,
        data,
      };

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
    get value() {
      return signal.value;
    },
  };
}
