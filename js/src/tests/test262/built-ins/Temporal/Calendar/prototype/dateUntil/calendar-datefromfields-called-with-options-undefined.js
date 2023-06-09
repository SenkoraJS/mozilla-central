// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.calendar.prototype.dateuntil
description: >
    Calendar.dateFromFields method is called with undefined as the options value
    when call originates internally
includes: [temporalHelpers.js]
features: [Temporal]
---*/

const calendar = TemporalHelpers.calendarFromFieldsUndefinedOptions();
calendar.dateUntil({ year: 2000, month: 5, day: 2, calendar }, { year: 2000, month: 5, day: 3, calendar });
assert.sameValue(calendar.dateFromFieldsCallCount, 2);

reportCompare(0, 0);
