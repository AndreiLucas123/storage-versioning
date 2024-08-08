import { test, expect } from '@playwright/test';
import { storageVersioning } from '../src';

//
//

declare const __storageVersioning: typeof storageVersioning;

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
    const storage = __storageVersioning('key1', 1, () => {});
    return storage.load();
  });

  expect(result1).toEqual(null);

  //
  // Will save, and when load must be the same

  const result2 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 1, () => {});
    storage.save({ name: 'John' });

    return storage.load();
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Will only load, must be the same

  const result3 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 1, () => {});
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
    const storage = __storageVersioning('key1', 1, () => {});
    storage.save({ name: 'John' });

    return storage.load();
  });

  expect(result1).toEqual({ name: 'John' });

  //
  // Must return John with the same version

  const result2 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 1, () => {});
    return storage.load();
  });

  expect(result2).toEqual({ name: 'John' });

  //
  // Must return null if the version is different

  const result3 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 2, () => {});

    return storage.load();
  });

  expect(result3).toEqual(null);

  //
  // Must return John if back to the same version

  const result4 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 1, () => {});
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
    const storage = __storageVersioning('key1', 1, () => {});

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
    const storage = __storageVersioning('key1', 1, () => {});
    return storage.load();
  });

  expect(result2).toEqual(null);
});

//
//

test('Expiration must notify', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  //
  // Must start with null

  const result1 = await page.evaluate(() => {
    const storage = __storageVersioning('key1', 1, (title) => {
      document.title = title + '';
    });

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
    const storage = __storageVersioning('key1', 1, (title) => {
      document.title = title + '';
    });

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
