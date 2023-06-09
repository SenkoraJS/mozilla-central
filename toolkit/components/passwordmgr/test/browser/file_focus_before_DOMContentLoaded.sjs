/**
 * Focus a username field before DOMContentLoaded.
 */

"use strict";

const DELAY = 2 * 1000; // Delay two seconds before completing the request.

// In an SJS file we need to get the setTimeout bits ourselves, despite
// what eslint might think applies for browser tests.
// eslint-disable-next-line mozilla/no-redeclare-with-import-autofix
let { setTimeout } = ChromeUtils.importESModule(
  "resource://gre/modules/Timer.sys.mjs"
);

function handleRequest(request, response) {
  response.processAsync();

  response.setHeader("Content-Type", "text/html;charset=utf-8", false);
  response.setHeader("Cache-Control", "no-cache", false);
  response.write(`
    <!DOCTYPE html><html><body>
      <form id="early_focus_form" action="https://autocomplete:8888/formtest.js">
        <input  type="text" id="uname" name="uname">
        <input  type="password" id="pword" name="pword">
        <button type="submit">Submit</button>
      </form>
      <script>document.querySelector("#uname").focus();</script>
  `);

  setTimeout(function finishOutput() {
    response.write(`</body></html>`);
    response.finish();
  }, DELAY);
}
