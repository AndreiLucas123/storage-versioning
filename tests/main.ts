import { int } from 'schemas-lib';
import { storageItem, setSignalFactory, storageGroup } from '../src';
import { getDiv } from './getDiv';

//
//

localStorage.clear();

const schema = int.catch(1);

(window as any).__setSignalFactory = setSignalFactory;
(window as any).__storageGroup = storageGroup;
(window as any).__storageItem = storageItem;
(window as any).__schema = schema;

//
//

getDiv('div1', (display) => {
  setSignalFactory(() => {
    let value: any = null;

    return {
      get value() {
        return value;
      },
      set value(newValue) {
        value = newValue;
        display(value);
      },
    };
  });

  //
  //

  const group = storageGroup({
    key99: storageItem('key99', 1),
  });
  group.listen();

  group.key99.save({ name: 'John', age: 30, rand: Math.random() });
  group.load();
});
