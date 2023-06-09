/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Test toggling the top level inversion state of the tree.

const {
  censusDisplays,
} = require("resource://devtools/client/memory/constants.js");
const {
  setCensusDisplay,
} = require("resource://devtools/client/memory/actions/census-display.js");

add_task(async function () {
  const store = Store();
  const { getState, dispatch } = store;

  dispatch(setCensusDisplay(censusDisplays.allocationStack));
  equal(getState().censusDisplay.inverted, false, "not inverted initially");

  dispatch(setCensusDisplay(censusDisplays.invertedAllocationStack));
  equal(getState().censusDisplay.inverted, true, "now inverted after toggling");

  dispatch(setCensusDisplay(censusDisplays.allocationStack));
  equal(
    getState().censusDisplay.inverted,
    false,
    "not inverted again after toggling again"
  );
});
