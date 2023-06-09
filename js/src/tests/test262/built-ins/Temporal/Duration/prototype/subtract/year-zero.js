// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.duration.prototype.subtract
description: Negative zero, as an extended year, is rejected
features: [Temporal, arrow-function]
---*/

const instance = new Temporal.Duration(1, 0, 0, 1);

let relativeTo = "-000000-11-04T00:00";
assert.throws(
  RangeError,
  () => { instance.subtract(new Temporal.Duration(0, 0, 0, 0, 24), { relativeTo }); },
  "reject minus zero as extended year"
);

reportCompare(0, 0);
