/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Test that we can log a message to the web console from the toolbox.

const TEST_URI =
  "data:text/html;charset=utf-8,<!DOCTYPE html><p>test logErrorInPage";

add_task(async function () {
  const hud = await openNewTabAndConsole(TEST_URI);
  const toolbox = hud.ui.wrapper.toolbox;

  toolbox.target.logErrorInPage("beware the octopus", "content javascript");

  const node = await waitFor(() => findErrorMessage(hud, "octopus"));
  ok(node, "text is displayed in web console");
  ok(node.classList.contains("error"), "the log represents an error");
});
