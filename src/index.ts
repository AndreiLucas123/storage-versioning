export { StorageVersioning } from './StorageVersioning';

//
//

export type StorageVersioningJSON<T> = {
  data: T;
  v?: string | number;
  exp?: number;
};
