import { ReadableSignal, WritableSignal } from 'signal-factory';

//
//

export type StorageItems = {
  [key: string]: any;
};

//
//

export type StorageVersions<T extends StorageItems> = {
  [K in keyof T]: string | number | ((value: T[K]) => T[K]);
};

//
//

export interface StorageVersioning<T extends StorageItems>
  extends WritableSignal<T | null> {
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
  load<K extends keyof T>(key: K): T[K] | null;

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
  save<K extends keyof T>(key: K, data: T[K], exp?: Date): void;

  /**
   * Add the event listener to listen the window storage event
   * @returns a function to remove the event listener
   */
  listen(): () => void;
}
