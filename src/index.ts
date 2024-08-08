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
   * Setup a listener to listen for changes in the localStorage
   *
   * listen the window storage event
   * @returns a function to remove the event listener
   */
  setup: () => () => void;
};

//
//

export type StorageVersioningJSON<T> = {
  v: string | number;
  data: T;
  exp?: number;
};

/**
 * Create a versioned storage
 * @param key the key to store the data
 * @param version the version of the data
 * @param onUpdate callback to call when the data is updated by window storage event
 * @returns a StorageVersioning object
 */
export function storageVersioning<T>(
  key: string,
  version: string | number,
  onUpdate: (data: T | null) => void,
): StorageVersioning<T> {
  let timeout: any = null;

  //
  //

  function load() {
    clearTimeout(timeout);

    try {
      const strItem = localStorage.getItem(key);
      if (!strItem) return null;

      const parsed: StorageVersioningJSON<T> = JSON.parse(strItem);

      if (parsed.v !== version) {
        return null;
      }

      if (parsed.exp) {
        const now = new Date().getTime();
        const diff = parsed.exp - now;
        if (diff > 0) {
          timeout = setTimeout(() => onUpdate(null), diff);
        } else {
          return null;
        }
      }

      return parsed.data as T;
    } catch (error) {
      console.error('[Error reading localStorage]', error);
    }
    return null;
  }

  //
  //

  function save(data: T | null, exp?: Date) {
    clearTimeout(timeout);

    if (data) {
      const dataToSave: StorageVersioningJSON<T> = {
        v: version,
        data,
      };

      if (exp) {
        dataToSave.exp = exp.getTime();
        const now = new Date().getTime();
        const diff = dataToSave.exp - now;
        
        if (diff > 0) {
          timeout = setTimeout(() => onUpdate(null), diff);
        }
      }

      localStorage.setItem(key, JSON.stringify(dataToSave));
    } else {
      localStorage.removeItem(key);
    }
  }

  //
  //

  function setup() {
    function onStorage(event: StorageEvent) {
      if (event.key === key) {
        onUpdate(load());
      }
    }

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }

  //
  //

  return {
    load,
    save,
    setup,
  };
}
