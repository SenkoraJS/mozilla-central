// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaintime.prototype.toplaindatetime
description: An exception from TimeZone#getOffsetNanosecondsFor() is propagated.
features: [Temporal]
---*/

class TZ extends Temporal.TimeZone {
  constructor() { super("UTC") }
  getOffsetNanosecondsFor() { throw new Test262Error() }
}

const tz = new TZ();
const arg = new Temporal.ZonedDateTime(0n, tz);
const instance = new Temporal.PlainTime(12, 34, 56, 987, 654, 321);

assert.throws(Test262Error, () => instance.toPlainDateTime(arg));

reportCompare(0, 0);
