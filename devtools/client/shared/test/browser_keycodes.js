/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { KeyCodes } = require("resource://devtools/client/shared/keycodes.js");

add_task(async function () {
  for (const key in KeyCodes) {
    is(KeyCodes[key], KeyboardEvent[key], "checking value for " + key);
  }
});
