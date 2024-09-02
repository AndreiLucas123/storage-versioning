import { int } from 'schemas-lib';
import { storageItem, storageGroup } from '../src/old-version/old-version';
import { StorageVersioning } from '../src/old-version/StorageVersioning';
import { storageVersioning } from '../src';
import { Store } from 'simorg-store';

//
//

localStorage.clear();

const schema = int.catch(1);

(window as any).__storageGroup = storageGroup;
(window as any).__storageItem = storageItem;
(window as any).__schema = schema;
(window as any).__StorageVersioning = StorageVersioning;
(window as any).__currentStorageVersioning = storageVersioning;
(window as any).__Store = Store;
