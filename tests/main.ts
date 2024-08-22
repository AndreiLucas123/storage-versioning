import { int } from 'schemas-lib';
import { storageItem, storageGroup } from '../src';
import { setSignalFactory, WritableSignal } from 'signal-factory';
import { store } from 'signal-factory/store';

//
//

localStorage.clear();

const schema = int.catch(1);

setSignalFactory(store);

(window as any).__storageGroup = storageGroup;
(window as any).__storageItem = storageItem;
(window as any).__schema = schema;
(window as any).__useDocumentTitle = useDocumentTitle;

//
//

export function useDocumentTitle(initial: string) {
  setSignalFactory(documentTitleSignal);
}

//
//

function documentTitleSignal(initial: string): WritableSignal<string> {
  const callbacks = new Set<(value: string) => void>();
  document.title = initial + '';

  const subscribe = (callback: (value: string) => void) => {
    callback(document.title);
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
    };
  };

  return {
    get() {
      return document.title;
    },
    set(newValue) {
      document.title = newValue;
      for (const callback of callbacks) {
        callback(document.title);
      }
    },
    subscribe,
  };
}
