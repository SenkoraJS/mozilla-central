// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plainyearmonth.prototype.equals
description: A number as calendar in a property bag is converted to a string, then to a calendar
features: [Temporal]
---*/

const instance = new Temporal.PlainYearMonth(2019, 6);

const calendar = 19970327;

let arg = { year: 2019, monthCode: "M06", calendar };
const result1 = instance.equals(arg);
assert.sameValue(result1, true, "19970327 is a valid ISO string for calendar");

arg = { year: 2019, monthCode: "M06", calendar: { calendar } };
const result2 = instance.equals(arg);
assert.sameValue(result2, true, "19970327 is a valid ISO string for calendar (nested property)");

const numbers = [
  1,
  -19970327,
  1234567890,
];

for (const calendar of numbers) {
  let arg = { year: 2019, monthCode: "M06", calendar };
  assert.throws(
    RangeError,
    () => instance.equals(arg),
    `Number ${calendar} does not convert to a valid ISO string for calendar`
  );
  arg = { year: 2019, monthCode: "M06", calendar: { calendar } };
  assert.throws(
    RangeError,
    () => instance.equals(arg),
    `Number ${calendar} does not convert to a valid ISO string for calendar (nested property)`
  );
}

reportCompare(0, 0);
