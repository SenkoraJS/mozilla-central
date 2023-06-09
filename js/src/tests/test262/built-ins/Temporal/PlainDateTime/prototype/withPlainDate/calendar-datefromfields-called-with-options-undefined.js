// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.prototype.withplaindate
description: >
    Calendar.dateFromFields method is called with undefined as the options value
    when call originates internally
includes: [temporalHelpers.js]
features: [Temporal]
---*/

const calendar = TemporalHelpers.calendarFromFieldsUndefinedOptions();
const instance = new Temporal.PlainDateTime(2000, 5, 2, 12, 34, 56, 987, 654, 321, calendar);
instance.withPlainDate({ year: 2000, month: 5, day: 3, calendar });
assert.sameValue(calendar.dateFromFieldsCallCount, 1);

reportCompare(0, 0);
