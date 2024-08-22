export { storageVersioning } from './storageVersioning';

//
//

export type StorageVersioningJSON<T> = {
  data: T;
  v?: string | number;
  exp?: number;
};
