// |reftest| skip-if(!this.hasOwnProperty("Intl"))

function groupByThree(s) {
  return String(s).split("").reduceRight((acc, x) => x + (acc.match(/^\d{3}/) ? "," : "") + acc, "");
}

const tests = [
  {value: "", expected: "0"},
  {value: "0", expected: "0"},
  {value: "+0", expected: "0"},
  {value: "-0", expected: "-0"},

  {value: "Infinity", expected: "∞"},
  {value: "+Infinity", expected: "∞"},
  {value: "-Infinity", expected: "-∞"},

  {value: "NaN", expected: "NaN"},
  {value: "invalid", expected: "NaN"},

  // Integer 1 with and without fractional/exponent part.
  {value: "1", expected: "1"},
  {value: "1.", expected: "1"},
  {value: "1.0", expected: "1"},
  {value: "1.00", expected: "1"},
  {value: "1e0", expected: "1"},
  {value: "1e+0", expected: "1"},
  {value: "1e-0", expected: "1"},

  // Leading zeros.
  {value: "01", expected: "1"},
  {value: "01.", expected: "1"},
  {value: "01.0", expected: "1"},
  {value: "01.00", expected: "1"},
  {value: "01e0", expected: "1"},
  {value: "01e+0", expected: "1"},
  {value: "01e-0", expected: "1"},

  // Large values.
  {value: "1e300", expected: "1" + ",000".repeat(100)},
  {value: "1e308", expected: "100" + ",000".repeat(102)},
  {value: "1e309", expected: "∞"},
  {value: "1e3000", expected: "∞"},
  {value: "1e+9999999", expected: "∞"},
  {value: "1e+99999999", expected: "∞"},
  {value: ".1e+9999999", expected: "∞"},
  {value: ".1e+99999999", expected: "∞"},
  {value: ".1e+999999999", expected: "∞"},
  {value: ".1e+9999999999", expected: "∞"},
  {value: "9007199254740991", expected: "9,007,199,254,740,991"},
  {value: "9007199254740992", expected: "9,007,199,254,740,992"},
  {value: "9007199254740993", expected: "9,007,199,254,740,993"},

  {value: "-1e300", expected: "-1" + ",000".repeat(100)},
  {value: "-1e308", expected: "-100" + ",000".repeat(102)},
  {value: "-1e309", expected: "-∞"},
  {value: "-1e3000", expected: "-∞"},
  {value: "-1e+9999999", expected: "-∞"},
  {value: "-1e+99999999", expected: "-∞"},
  {value: "-.1e+9999999", expected: "-∞"},
  {value: "-.1e+99999999", expected: "-∞"},
  {value: "-.1e+999999999", expected: "-∞"},
  {value: "-.1e+9999999999", expected: "-∞"},
  {value: "-9007199254740991", expected: "-9,007,199,254,740,991"},
  {value: "-9007199254740992", expected: "-9,007,199,254,740,992"},
  {value: "-9007199254740993", expected: "-9,007,199,254,740,993"},

  // Small values.
  {value: "0.10000000000000000001", expected: "0.10000000000000000001"},
  {value: "0.00000000000000000001", expected: "0.00000000000000000001"},
  {value: "1e-20", expected: "0.00000000000000000001"},
  {value: "1e-30", expected: "0"},
  {value: ".1e-9999999", expected: "0"},
  {value: ".1e-99999999", expected: "0"},
  {value: ".1e-999999999", expected: "0"},
  {value: ".1e-9999999999", expected: "0"},

  {value: "-0.10000000000000000001", expected: "-0.10000000000000000001"},
  {value: "-0.00000000000000000001", expected: "-0.00000000000000000001"},
  {value: "-1e-20", expected: "-0.00000000000000000001"},
  {value: "-1e-30", expected: "-0"},
  {value: "-.1e-9999999", expected: "-0"},
  {value: "-.1e-99999999", expected: "-0"},
  {value: "-.1e-999999999", expected: "-0"},
  {value: "-.1e-9999999999", expected: "-0"},

  // Non-standard exponent notation.
  {value: ".001e-2", expected: "0.00001"},
  {value: "123.001e-2", expected: "1.23001"},
  {value: "1000e-2", expected: "10"},
  {value: "1000e+2", expected: "100,000"},
  {value: "1000e-0", expected: "1,000"},

  // Non-decimal strings.
  {value: "0b101", expected: "5"},
  {value: "0o377", expected: "255"},
  {value: "0xdeadBEEF", expected: "3,735,928,559"},
  {value: "0B0011", expected: "3"},
  {value: "0O0777", expected: "511"},
  {value: "0X0ABC", expected: "2,748"},
  {value: "0b" + "1".repeat(1000), expected: groupByThree((2n ** 1000n) - 1n)},
  {value: "0o1" + "7".repeat(333), expected: groupByThree((2n ** 1000n) - 1n)},
  {value: "0x" + "f".repeat(250), expected: groupByThree((2n ** 1000n) - 1n)},

  {value: "0b" + "1".repeat(1023), expected: groupByThree(0b10n ** 1023n - 1n)},
  {value: "0b" + "1".repeat(1024), expected: "∞"},
  {value: "0o" + "7".repeat(341), expected: groupByThree(0o10n ** 341n - 1n)},
  {value: "0o" + "7".repeat(342), expected: "∞"},
  {value: "0x" + "f".repeat(255), expected: groupByThree(0x10n ** 255n - 1n)},
  {value: "0x" + "f".repeat(256), expected: "∞"},

  // Non-decimal strings don't accept a sign.
  {value: "+0xbad", expected: "NaN"},
  {value: "-0xbad", expected: "NaN"},
];

// https://tc39.es/ecma262/#prod-StrWhiteSpaceChar
const strWhiteSpaceChar = [
  "",

  // https://tc39.es/ecma262/#sec-white-space
  "\t", "\v", "\f", " ", "\u00A0", "\uFEFF",
  "\u1680", "\u2000", "\u2001", "\u2002", "\u2003", "\u2004", "\u2005", "\u2006",
  "\u2007", "\u2008", "\u2009", "\u200A", "\u202F", "\u205F", "\u3000",

  // https://tc39.es/ecma262/#sec-line-terminators
  "\n", "\r", "\u2028", "\u2029",
];

let nf = new Intl.NumberFormat("en", {maximumFractionDigits: 20});
for (let {value, expected} of tests) {
  for (let ws of strWhiteSpaceChar) {
    assertEq(nf.format(ws + value), expected);
    assertEq(nf.format(value + ws), expected);
    assertEq(nf.format(ws + value + ws), expected);
  }
}

// Combine extreme values with other rounding modes.
{
  let nf = new Intl.NumberFormat("en", {
    minimumFractionDigits: 20,
    roundingMode: "ceil",
    roundingIncrement: 5000,
  });
  assertEq(nf.format(".1e-999999998"), "0.00000000000000000000");
}

if (typeof reportCompare === "function")
  reportCompare(true, true);
