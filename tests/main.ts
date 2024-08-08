import { storageVersioning } from '../src';
import { getDiv } from './getDiv';

//
//

localStorage.clear();

(window as any).__storageVersioning = storageVersioning

//
//

getDiv('div1', (display) => {
  const storage = storageVersioning('key1', 1, display);
  storage.setup();

  storage.save({ name: 'John' });
  display(storage.load());
});

//
//

getDiv('div2', (display) => {
  const storage = storageVersioning('key2', 1, display);
  storage.setup();

  storage.save({ name: 'John' });
  display(storage.load());
});
