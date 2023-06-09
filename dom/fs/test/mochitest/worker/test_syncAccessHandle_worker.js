/**
 * Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

add_task(async function init() {
  const testCases = await require_module(
    "dom/fs/test/common/test_syncAccessHandle.js"
  );
  Object.values(testCases).forEach(async testItem => {
    // We can't shrink storage size in a mochitest.
    if (testItem.name != "quotaTest") {
      add_task(testItem);
    }
  });
});
