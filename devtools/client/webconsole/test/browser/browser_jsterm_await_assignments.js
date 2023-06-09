/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

// Test that top-level await expressions work as expected.

"use strict";

const TEST_URI =
  "data:text/html;charset=utf-8,<!DOCTYPE html>Web Console test top-level await bindings";

add_task(async function () {
  // Enable await mapping.
  await pushPref("devtools.debugger.features.map-await-expression", true);
  const hud = await openNewTabAndConsole(TEST_URI);

  info("Check that declaring a let variable does not create a global property");
  await executeAndWaitForResultMessage(
    hud,
    `let bazA = await new Promise(r => setTimeout(() => r("local-bazA"), 10))`,
    "local-bazA"
  );
  await checkVariable(hud, "bazA");

  info(
    "Check that declaring a const variable does not create a global property"
  );
  await executeAndWaitForResultMessage(
    hud,
    `const bazB = await new Promise(r => setTimeout(() => r("local-bazB"), 10))`,
    "local-bazB"
  );
  await checkVariable(hud, "bazB");

  info("Check that complex variable declarations work as expected");
  await executeAndWaitForResultMessage(
    hud,
    `
    let bazC = "local-bazC", bazD, bazE = "local-bazE";
    bazD = await new Promise(r => setTimeout(() => r("local-bazD"), 10));
    let {
      a: bazF,
      b: {
        c: {
          bazG = "local-bazG",
          d: bazH,
          e: [bazI, bazJ = "local-bazJ"]
        },
        d: bazK = "local-bazK"
      }
    } = await ({
      a: "local-bazF",
      b: {
        c: {
          d: "local-bazH",
          e: ["local-bazI"]
        }
      }
    });`,
    ""
  );
  await checkVariable(hud, "bazC");
  await checkVariable(hud, "bazD");
  await checkVariable(hud, "bazE");
  await checkVariable(hud, "bazF");
  await checkVariable(hud, "bazG");
  await checkVariable(hud, "bazH");
  await checkVariable(hud, "bazI");
  await checkVariable(hud, "bazJ");
  await checkVariable(hud, "bazK");
});

async function checkVariable(hud, varName) {
  await executeAndWaitForResultMessage(hud, `window.${varName}`, `undefined`);
  ok(true, `The ${varName} assignment did not create a global variable`);
  await executeAndWaitForResultMessage(hud, varName, `"local-${varName}"`);
  ok(true, `"${varName}" has the expected value`);
}
