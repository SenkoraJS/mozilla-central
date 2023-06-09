/**
 * Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

/* exported testGenerator */
var testGenerator = testSteps();

function* testSteps() {
  const name = this.window ? window.location.pathname : "Splendid Test";
  const objectStoreName = "Objects";

  let testString = { value: "testString" };
  let testInt = { value: 1002 };

  let request = indexedDB.open(name, 1);
  request.onerror = errorHandler;
  request.onupgradeneeded = grabEventAndContinueHandler;
  request.onsuccess = grabEventAndContinueHandler;
  let event = yield undefined;

  let db = event.target.result;

  let objectStore = db.createObjectStore(objectStoreName, { autoIncrement: 1 });

  request = objectStore.put(testString.value);
  request.onerror = errorHandler;
  request.onsuccess = function (event) {
    testString.key = event.target.result;
    request = objectStore.get(testString.key);
    request.onerror = errorHandler;
    request.onsuccess = function (event) {
      is(event.target.result, testString.value, "Got the right value");
    };
  };

  request = objectStore.put(testInt.value);
  request.onerror = errorHandler;
  request.onsuccess = function (event) {
    testInt.key = event.target.result;
    request = objectStore.get(testInt.key);
    request.onerror = errorHandler;
    request.onsuccess = function (event) {
      is(event.target.result, testInt.value, "Got the right value");
    };
  };

  // Wait for success
  yield undefined;

  finishTest();
}
