// |reftest| skip-if(!this.hasOwnProperty('Temporal')) -- Temporal is not enabled unconditionally
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.zoneddatetime.prototype.constructor
description: Test for Temporal.ZonedDateTime.prototype.constructor.
info: The initial value of Temporal.ZonedDateTime.prototype.constructor is %Temporal.ZonedDateTime%.
includes: [propertyHelper.js]
features: [Temporal]
---*/

verifyProperty(Temporal.ZonedDateTime.prototype, "constructor", {
  value: Temporal.ZonedDateTime,
  writable: true,
  enumerable: false,
  configurable: true,
});

reportCompare(0, 0);
