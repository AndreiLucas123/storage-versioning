//
//

export type StorageVersioning<T> = {
  load: () => T | null;
  save: (data: T | null, exp?: Date) => void;
  setup: () => () => void;
};

//
//

export type StorageVersioningJSON<T> = {
  v: string;
  data: T;
  exp?: number;
};

//
//

export function storageVersioning<T>(
  key: string,
  version: string,
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
