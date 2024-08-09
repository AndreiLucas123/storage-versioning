import { test, expect, Page } from '@playwright/test';
import { setSignalFactory, storageGroup, storageItem } from '../src';

//
//

declare const __setSignalFactory: typeof setSignalFactory;
declare const __storageGroup: typeof storageGroup;
declare const __storageItem: typeof storageItem;

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

  // Must set the signal factory before anything
  await page.evaluate(() => {
    __setSignalFactory(() => ({ value: null }));
  });

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

  // Must set the signal factory before anything
  await page.evaluate(() => {
    __setSignalFactory(() => ({ value: null }));
  });

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

  // Must set the signal factory before anything
  await page.evaluate(() => {
    __setSignalFactory(() => ({ value: null }));
  });

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

async function setDocumentTitleSignal(page: Page) {
  await page.evaluate(() => {
    __setSignalFactory(() => {
      document.title = 'null';
      return {
        get value() {
          return document.title;
        },

        set value(newValue) {
          document.title = newValue;
        },
      };
    });
  });
}

//
//

test('Expiration must notify', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Set the signal to change the document title
  await setDocumentTitleSignal(page);

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
  await setDocumentTitleSignal(page);

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

  // Must set the signal factory before anything
  await page.evaluate(() => {
    __setSignalFactory(() => ({ value: null }));
  });

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
      key1: group.key1.value,
      key2: group.key2.value,
    };
  });

  expect(result1).toEqual({
    key1: 'John',
    key2: 'Doe',
  });
});
