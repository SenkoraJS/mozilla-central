// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaintime.prototype.tostring
description: TypeError thrown when a primitive is passed as the options argument
features: [Temporal]
---*/

const instance = Temporal.PlainTime.from("12:56:32");
const values = [null, true, "hello", Symbol("foo"), 1, 1n];

for (const badOptions of values) {
  assert.throws(TypeError, () => instance.toString(badOptions));
}

reportCompare(0, 0);
