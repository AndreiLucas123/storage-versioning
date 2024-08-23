export type { StorageVersioning, StorageVersions, StorageItems } from './types';

export { storageVersioning } from './storageVersioning';

//
//

export type StorageVersioningJSON<T> = {
  data: T;
  v?: string | number;
  exp?: number;
};
