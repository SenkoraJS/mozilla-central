/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Browser tests for Pocket suggestions.

const REMOTE_SETTINGS_DATA = [
  {
    type: "pocket-suggestions",
    attachment: [
      {
        url: "https://example.com/pocket-suggestion",
        title: "Pocket Suggestion",
        keywords: ["pocket-suggestion"],
      },
    ],
  },
];

add_setup(async function () {
  // This must be done before enabling the feature (using the `featureGate`
  // pref) so that the mock remote settings are set up first. Also, don't pass
  // in the remote settings data yet; see below.
  await QuickSuggestTestUtils.ensureQuickSuggestInit();

  await SpecialPowers.pushPrefEnv({
    set: [
      ["browser.urlbar.quicksuggest.enabled", true],
      ["browser.urlbar.suggest.quicksuggest.nonsponsored", true],
      ["browser.urlbar.bestMatch.enabled", true],
      ["browser.urlbar.pocket.featureGate", true],
      // Disable search suggestions so we don't hit the network.
      ["browser.search.suggest.enabled", false],
    ],
  });

  // Now that the feature is enabled, set the remote settings data to force the
  // feature to sync so we can be sure syncing is done before starting the test.
  await QuickSuggestTestUtils.setRemoteSettingsResults(REMOTE_SETTINGS_DATA);
});

add_task(async function basic() {
  await BrowserTestUtils.withNewTab("about:blank", async () => {
    // Do a search.
    await UrlbarTestUtils.promiseAutocompleteResultPopup({
      window,
      value: "pocket-suggestion",
    });

    // Check the result.
    Assert.equal(
      UrlbarTestUtils.getResultCount(window),
      2,
      "There should be two results"
    );

    let { element, result } = await UrlbarTestUtils.getDetailsOfResultAt(
      window,
      1
    );
    Assert.equal(
      result.providerName,
      UrlbarProviderQuickSuggest.name,
      "The result should be from the expected provider"
    );
    Assert.equal(
      result.payload.telemetryType,
      "pocket",
      "The result should be a Pocket result"
    );

    // Click it.
    let url = REMOTE_SETTINGS_DATA[0].attachment[0].url;
    const onLoad = BrowserTestUtils.browserLoaded(
      gBrowser.selectedBrowser,
      false,
      url
    );
    EventUtils.synthesizeMouseAtCenter(element.row, {});
    await onLoad;
    Assert.equal(gBrowser.currentURI.spec, url, "Expected page loaded");
  });
});

// Tests the "Not interested" result menu dismissal command.
add_task(async function resultMenu_notInterested() {
  await doDismissTest("not_interested");
});

// Tests the "Not relevant" result menu dismissal command.
add_task(async function notRelevant() {
  await doDismissTest("not_relevant");
});

async function doDismissTest(command) {
  // Do a search.
  await UrlbarTestUtils.promiseAutocompleteResultPopup({
    window,
    value: "pocket-suggestion",
  });

  // Check the result.
  let resultCount = 2;
  Assert.equal(
    UrlbarTestUtils.getResultCount(window),
    resultCount,
    "There should be two results"
  );

  let resultIndex = 1;
  let { result } = await UrlbarTestUtils.getDetailsOfResultAt(
    window,
    resultIndex
  );
  Assert.equal(
    result.providerName,
    UrlbarProviderQuickSuggest.name,
    "The result should be from the expected provider"
  );
  Assert.equal(
    result.payload.telemetryType,
    "pocket",
    "The result should be a Pocket result"
  );

  // Click the command.
  await UrlbarTestUtils.openResultMenuAndClickItem(
    window,
    ["[data-l10n-id=firefox-suggest-command-dont-show-this]", command],
    { resultIndex, openByMouse: true }
  );

  // The row should be a tip now.
  Assert.ok(gURLBar.view.isOpen, "The view should remain open after dismissal");
  Assert.equal(
    UrlbarTestUtils.getResultCount(window),
    resultCount,
    "The result count should not haved changed after dismissal"
  );
  let details = await UrlbarTestUtils.getDetailsOfResultAt(window, resultIndex);
  Assert.equal(
    details.type,
    UrlbarUtils.RESULT_TYPE.TIP,
    "Row should be a tip after dismissal"
  );
  Assert.equal(
    details.result.payload.type,
    "dismissalAcknowledgment",
    "Tip type should be dismissalAcknowledgment"
  );
  Assert.ok(
    !details.element.row.hasAttribute("feedback-acknowledgment"),
    "Row should not have feedback acknowledgment after dismissal"
  );

  // Get the dismissal acknowledgment's "Got it" button and click it.
  let gotItButton = UrlbarTestUtils.getButtonForResultIndex(
    window,
    0,
    resultIndex
  );
  Assert.ok(gotItButton, "Row should have a 'Got it' button");
  EventUtils.synthesizeMouseAtCenter(gotItButton, {}, window);

  // The view should remain open and the tip row should be gone.
  Assert.ok(
    gURLBar.view.isOpen,
    "The view should remain open clicking the 'Got it' button"
  );
  Assert.equal(
    UrlbarTestUtils.getResultCount(window),
    resultCount - 1,
    "The result count should be one less after clicking 'Got it' button"
  );
  for (let i = 0; i < UrlbarTestUtils.getResultCount(window); i++) {
    details = await UrlbarTestUtils.getDetailsOfResultAt(window, i);
    Assert.ok(
      details.type != UrlbarUtils.RESULT_TYPE.TIP &&
        details.result.payload.telemetryType !== "pocket",
      "Tip result and suggestion should not be present"
    );
  }

  gURLBar.handleRevert();

  // Do the search again.
  await UrlbarTestUtils.promiseAutocompleteResultPopup({
    window,
    value: "pocket-suggestion",
  });
  for (let i = 0; i < UrlbarTestUtils.getResultCount(window); i++) {
    details = await UrlbarTestUtils.getDetailsOfResultAt(window, i);
    Assert.ok(
      details.type != UrlbarUtils.RESULT_TYPE.TIP &&
        details.result.payload.telemetryType !== "pocket",
      "Tip result and suggestion should not be present"
    );
  }

  await UrlbarTestUtils.promisePopupClose(window);
  await QuickSuggest.blockedSuggestions.clear();
}
