/* Any copyright is dedicated to the Public Domain.
 http://creativecommons.org/publicdomain/zero/1.0/ */
/* import-globals-from helper_events_test_runner.js */
"use strict";

requestLongerTimeout(4);

// Test that markup view event bubbles show the correct event info for React
// events (React production version 15.3.1) using JSX.

const TEST_LIB = URL_ROOT_SSL + "lib_react_with_addons_15.3.1_min.js";
const TEST_LIB_BABEL = URL_ROOT_SSL + "lib_babel_6.21.0_min.js";
const TEST_EXTERNAL_LISTENERS = URL_ROOT_SSL + "react_external_listeners.js";
const TEST_URL =
  URL_ROOT_SSL + "doc_markup_events_react_production_15.3.1_jsx.html";
const TEST_INLINE_BABEL_ORIGINAL = URL_ROOT_SSL + "Inline%20Babel%20script:9";

loadHelperScript("helper_events_test_runner.js");

/*eslint-disable */
const TEST_DATA = [
  {
    selector: "#inlinejsx",
    isSourceMapped: true,
    expected: [
      {
        type: "click",
        filename: TEST_LIB + ":16:27180",
        attributes: ["Bubbling"],
        handler: `function() {}`,
      },
      {
        type: "onClick",
        filename: TEST_INLINE_BABEL_ORIGINAL,
        attributes: ["React", "Bubbling"],
        handler: `
          function() {
            alert("inlineFunction");
          }`,
      },
    ],
  },
  {
    selector: "#externaljsx",
    expected: [
      {
        type: "click",
        filename: TEST_LIB + ":16:27180",
        attributes: ["Bubbling"],
        handler: `function() {}`,
      },
      {
        type: "onClick",
        filename: TEST_EXTERNAL_LISTENERS + ":4:25",
        attributes: ["React", "Bubbling"],
        handler: `
          function externalFunction() {
            alert("externalFunction");
          }`,
      },
    ],
  },
  {
    selector: "#externalinlinejsx",
    expected: [
      {
        type: "click",
        filename: TEST_LIB + ":16:27180",
        attributes: ["Bubbling"],
        handler: `function() {}`,
      },
      {
        type: "onClick",
        filename: TEST_EXTERNAL_LISTENERS + ":4:25",
        attributes: ["React", "Bubbling"],
        handler: `
          function externalFunction() {
            alert("externalFunction");
          }`,
      },
      {
        type: "onMouseUp",
        filename: TEST_LIB_BABEL + ":11:41",
        attributes: ["React", "Bubbling"],
        handler: `
          function() {
            alert("inlineFunction");
          }`,
      },
    ],
  },
  {
    selector: "#externalcapturingjsx",
    expected: [
      {
        type: "onClickCapture",
        filename: TEST_EXTERNAL_LISTENERS + ":8:34",
        attributes: ["React", "Capturing"],
        handler: `
          function externalCapturingFunction() {
            alert("externalCapturingFunction");
          }`,
      },
    ],
  },
];
/* eslint-enable */

add_task(async function () {
  info(
    "Switch to 2 pane inspector to avoid sidebar width issues with opening events"
  );
  await pushPref("devtools.inspector.three-pane-enabled", false);
  await pushPref("devtools.toolsidebar-width.inspector", 350);
  await runEventPopupTests(TEST_URL, TEST_DATA);
});
