// Create two different globals whose compartments have two different
// principals. Test getting the first frame on the stack with some given
// principals in various configurations of JS stack and of wanting self-hosted
// frames or not.

const g1 = newGlobal({
  principal: 0xffff
});

const g2 = newGlobal({
  principal: 0xff
});

// Introduce everyone to themselves and each other.
g1.g2 = g2.g2 = g2;
g1.g1 = g2.g1 = g1;

g1.g2obj = g2.eval("new Object");

g1.evaluate(`
  const global = this;

  // Capture the stack back to the first frame in the g2 global.
  function capture(shouldIgnoreSelfHosted = true) {
    return captureFirstSubsumedFrame(global.g2obj, shouldIgnoreSelfHosted);
  }
`, {
  fileName: "script1.js"
});

g2.evaluate(`
  const capture = g1.capture;

  function getOldestFrame(stack) {
    while (stack.parent) {
      stack = stack.parent;
    }
    return stack;
  }

  function dumpStack(name, stack) {
    print("Stack " + name + " =");
    while (stack) {
      print("    " + stack.functionDisplayName + " @ " + stack.source);
      stack = stack.parent;
    }
    print();
  }

  // When the youngest frame is not self-hosted, it doesn't matter whether or not
  // we specify that we should ignore self hosted frames when capturing the first
  // frame with the given principals.
  //
  // Stack: iife1 (g2) <- capture (g1)

  (function iife1() {
    const captureTrueStack = capture(true);
    dumpStack("captureTrueStack", captureTrueStack);
    assertEq(getOldestFrame(captureTrueStack).functionDisplayName, "iife1");
    assertEq(getOldestFrame(captureTrueStack).source, "script2.js");

    const captureFalseStack = capture(false);
    dumpStack("captureFalseStack", captureFalseStack);
    assertEq(getOldestFrame(captureFalseStack).functionDisplayName, "iife1");
    assertEq(getOldestFrame(captureFalseStack).source, "script2.js");
  }());

  // When the youngest frame is a self hosted frame, we get two different
  // captured stacks depending on whether or not we ignore self-hosted frames.
  //
  // Stack: iife2 (g2) <- Array.prototype.map <- capture (g1)

  (function iife2() {
    const trueStack = [true].map(capture)[0];
    dumpStack("trueStack", trueStack);
    assertEq(getOldestFrame(trueStack).functionDisplayName, "iife2");
    assertEq(getOldestFrame(trueStack).source, "script2.js");

    const falseStack = [false].map(capture)[0];
    dumpStack("falseStack", falseStack);
    assertEq(getOldestFrame(falseStack).functionDisplayName !== "iife2", true);
    assertEq(getOldestFrame(falseStack).source, "self-hosted");
  }());
`, {
  fileName: "script2.js"
});
