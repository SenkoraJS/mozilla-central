// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2021 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaindatetime.compare
description: RangeError thrown if time zone reports an offset that is out of range
features: [Temporal]
includes: [temporalHelpers.js]
---*/

[-86400_000_000_001, 86400_000_000_001].forEach((wrongOffset) => {
  const timeZone = TemporalHelpers.specificOffsetTimeZone(wrongOffset);
  const datetime = new Temporal.ZonedDateTime(1_000_000_000_987_654_321n, timeZone);
  const plain = new Temporal.PlainDateTime(2000, 5, 2, 12, 34, 56, 987, 654, 321);

  assert.throws(RangeError, () => Temporal.PlainDateTime.compare(datetime, plain));
  assert.throws(RangeError, () => Temporal.PlainDateTime.compare(plain, datetime));
});

reportCompare(0, 0);
