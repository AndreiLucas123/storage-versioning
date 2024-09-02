import type { Store } from 'simorg-store';
import { test, expect } from '@playwright/test';
import { storageGroup, storageItem } from '../../src/old-version/old-version';
import { int, Schema } from 'schemas-lib';
import { StorageVersioning } from '../../src/old-version/StorageVersioning';

//
//

declare const __storageGroup: typeof storageGroup;
declare const __storageItem: typeof storageItem;
declare const __schema: Schema<number | null | undefined>;
declare const __Store: typeof Store<any>;

//
//

test('Must show Data 1', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const textToFind = 'DATA 1';
  const div = page.locator(`div:has-text("${textToFind}")`);

  // Expect a title "to contain" a substring.
  expect(await div.count()).toBe(1);
});

//
//

test('storageVersioning must save and load successfully', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result1).toEqual(null);

  //
  // Will save, and when load must be the same

  const result2 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    storage.save({ name: 'John' });

    return storage.load();
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Will only load, must be the same

  const result3 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result3).toEqual({ name: 'John' });
});

//
//

test('When change version, must return null', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must save with version 1

  const result1 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    storage.save({ name: 'John' });

    return storage.load();
  });

  expect(result1).toEqual({ name: 'John' });

  //
  // Must return John with the same version

  const result2 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Must return null if the version is different

  const result3 = await page.evaluate(() => {
    const storage = __storageItem('key1', 2);

    return storage.load();
  });

  expect(result3).toEqual(null);

  //
  // Must return John if back to the same version

  const result4 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result4).toEqual({ name: 'John' });
});

//
//

test('Must expirate', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);

    const exp = new Date();
    exp.setSeconds(exp.getSeconds() + 1);

    storage.save({ name: 'John' }, exp);

    return storage.load();
  });

  expect(result1).toEqual({ name: 'John' });

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(1200);

  //
  // Will save, and when load must be the same

  const result2 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result2).toEqual(null);
});

//
//

test('Expiration must notify', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Set the signal to change the document title
  await page.evaluate(() => {
    const store = new __Store(null);
    store.subscribe((value) => {
      document.title = value + '';
    })
  });

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);

    const exp = new Date();
    exp.setSeconds(exp.getSeconds() + 1);

    storage.save('Jhon', exp);

    return storage.load();
  });

  expect(result1).toEqual('Jhon');

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(1200);

  //
  // Will save, and when load must be the same

  expect(await page.title()).toBe('null');
});

//
//

test('Expiration must notify without save', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Set the signal to change the document title
  await page.evaluate(() => {
    const store = new __Store(null);
    store.subscribe((value) => {
      document.title = value + '';
    })
  });

  //
  // Change the localStorage manually

  await page.evaluate(() => {
    const exp = new Date();
    exp.setSeconds(exp.getSeconds() + 1);

    localStorage.setItem(
      'key1',
      JSON.stringify({
        v: 1,
        data: 'Jhon',
        exp: exp.getTime(),
      }),
    );
  });

  //
  // Must expirate and notify without calling save method

  const result1 = await page.evaluate(() => {
    const storage = __storageItem('key1', 1);
    return storage.load();
  });

  expect(result1).toEqual('Jhon');

  //
  // Wait 1.2 seconds
  await page.waitForTimeout(1200);

  //
  // Will save, and when load must be the same

  expect(await page.title()).toBe('null');
});

//
//

test('storageGroup must load all storages', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const group = __storageGroup({
      key1: __storageItem('key1', 1),
      key2: __storageItem('key2', 1),
    });

    group.key1.save('John');
    group.key2.save('Doe');

    group.load();

    return {
      key1: group.key1.get(),
      key2: group.key2.get(),
    };
  });

  expect(result1).toEqual({
    key1: 'John',
    key2: 'Doe',
  });
});

//
//

test('Must validate with schemas-lib when save', async ({ page }) => {
  const schema = int.catch(1);

  expect(schema.parse(1)).toBe(1);
  expect(schema.parse('asdasfasdas')).toBe(1);

  //
  //

  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const group = __storageGroup({
      key1: __storageItem('key1', (data) => __schema.parse(data)),
    });

    // When save it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    group.key1.save('John' as any);

    group.load();

    return group.key1.get();
  });

  //
  //

  expect(result1).toBe(1);
});

//
//

test('Must validate with schemas-lib when load', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    const store1 = __storageItem('key1');
    store1.save('John' as any); // Save a string, but the schema requires a number

    //
    //

    const group = __storageGroup({
      key1: __storageItem('key1', (data) => __schema.parse(data)),
    });

    // When load it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    group.load();

    return group.key1.get();
  });

  //
  //

  expect(result1).toBe(1);
});

//
//

test('Must load a wrong format localStorage item', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  const result1 = await page.evaluate(() => {
    localStorage.setItem('key1', 'wrong format');

    //
    //

    const group = __storageGroup({
      key1: __storageItem('key1', (data) => __schema.parse(data)),
    });

    // When load it will be parsed to 1
    // because it is not a number
    // the schema is in main.ts file
    group.load();

    return group.key1.get();
  });

  //
  //

  expect(result1).toBe(null);
});

//
//

test('When set to noLocalStorage must not access localStorage', () => {
  const storage = new StorageVersioning(
    {
      key1: 1,
    },
    {
      key1: 'Jhon',
    },
    true,
  );

  //
  //

  // Should not throw an error
  storage.save('key1', 'Some value');

  // Should not throw an error
  expect(storage.load('key1')).toBe('Some value');

  // Should not throw an error
  storage.listen()();
});
