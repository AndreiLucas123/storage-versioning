import { int } from 'schemas-lib';
import { storageItem, storageGroup } from '../src';
import { setSignalFactory, Signal } from 'signal-factory';
import { signal } from 'signal-factory/vanilla';

//
//

localStorage.clear();

const schema = int.catch(1);

setSignalFactory(signal);

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

function documentTitleSignal(initial: string): Signal<string> {
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
    get value() {
      return document.title;
    },
    set value(newValue) {
      document.title = newValue;
      for (const callback of callbacks) {
        callback(document.title);
      }
    },
    subscribe,
  };
}
