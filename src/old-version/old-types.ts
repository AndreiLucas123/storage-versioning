import type { ReadableSignal } from 'simorg-store';

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
