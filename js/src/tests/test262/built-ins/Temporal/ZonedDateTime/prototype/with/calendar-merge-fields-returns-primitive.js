// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2021 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.with
description: >
    with() should throw a TypeError if mergeFields() returns a primitive,
    without passing the value on to any other calendar methods
includes: [compareArray.js, temporalHelpers.js]
features: [BigInt, Symbol, Temporal]
---*/

[undefined, null, true, 3.14159, "bad value", Symbol("no"), 7n].forEach((primitive) => {
  const calendar = TemporalHelpers.calendarMergeFieldsReturnsPrimitive(primitive);
  const instance = new Temporal.ZonedDateTime(1_000_000_000_000_000_000n, "UTC", calendar);
  assert.throws(TypeError, () => instance.with({ year: 2005 }), "bad return from mergeFields() throws");
  assert.sameValue(calendar.dateFromFieldsCallCount, 0, "dateFromFields() never called");
});

reportCompare(0, 0);
