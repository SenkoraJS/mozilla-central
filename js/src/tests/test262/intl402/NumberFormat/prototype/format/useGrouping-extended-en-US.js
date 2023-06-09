// Copyright 2021 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-intl.numberformat.prototype.format
description: |
  Checks handling of the useGrouping option to the NumberFormat constructor.
locale: [en-US]
features: [Intl.NumberFormat-v3]
---*/

var nf;

nf = new Intl.NumberFormat('en-US', {useGrouping: 'always'});

assert.sameValue(nf.format(100), '100', '"always"');
assert.sameValue(nf.format(1000), '1,000', '"always"');
assert.sameValue(nf.format(10000), '10,000', '"always"');
assert.sameValue(nf.format(100000), '100,000', '"always"');

nf = new Intl.NumberFormat('en-US', {useGrouping: 'min2'});

assert.sameValue(nf.format(100), '100', '"min2"');
assert.sameValue(nf.format(1000), '1000', '"min2"');
assert.sameValue(nf.format(10000), '10,000', '"min2"');
assert.sameValue(nf.format(100000), '100,000', '"min2"');

nf = new Intl.NumberFormat('en-US', {notation: 'compact'});

assert.sameValue(nf.format(100), '100', 'notation: "compact"');
assert.sameValue(nf.format(1000), '1K', 'notation: "compact"');
assert.sameValue(nf.format(10000), '10K', 'notation: "compact"');
assert.sameValue(nf.format(100000), '100K', 'notation: "compact"');

reportCompare(0, 0);
