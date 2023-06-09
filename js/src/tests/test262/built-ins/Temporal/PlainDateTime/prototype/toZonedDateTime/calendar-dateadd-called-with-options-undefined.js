// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2021 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.prototype.tozoneddatetime
description: >
    BuiltinTimeZoneGetInstantFor calls Calendar.dateAdd with undefined as the
    options value
includes: [temporalHelpers.js]
features: [Temporal]
---*/

const calendar = TemporalHelpers.calendarDateAddUndefinedOptions();
const timeZone = TemporalHelpers.oneShiftTimeZone(new Temporal.Instant(0n), 3600e9);
const instance = new Temporal.PlainDateTime(1970, 1, 1, 0, 0, 0, 0, 0, 0, calendar);

["earlier", "compatible", "later"].forEach((disambiguation) => {
  calendar.dateAddCallCount = 0;

  instance.toZonedDateTime(timeZone, { disambiguation });
  assert.sameValue(calendar.dateAddCallCount, 1, `calling with disambiguation ${disambiguation}`);
});

reportCompare(0, 0);
