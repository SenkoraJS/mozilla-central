// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.now.plaindatetime
description: Leap second is a valid ISO string for Calendar
features: [Temporal]
---*/

let arg = "2016-12-31T23:59:60";
const result1 = Temporal.Now.plainDateTime(arg);
assert.sameValue(
  result1.calendar.id,
  "iso8601",
  "leap second is a valid ISO string for Calendar"
);

arg = { calendar: "2016-12-31T23:59:60" };
const result2 = Temporal.Now.plainDateTime(arg);
assert.sameValue(
  result2.calendar.id,
  "iso8601",
  "leap second is a valid ISO string for Calendar (nested property)"
);

reportCompare(0, 0);
