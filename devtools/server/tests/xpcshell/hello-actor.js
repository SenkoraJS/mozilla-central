/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */
/* eslint no-unused-vars: ["error", {"vars": "local"}] */

"use strict";

const protocol = require("resource://devtools/shared/protocol.js");

const helloSpec = protocol.generateActorSpec({
  typeName: "helloActor",

  methods: {
    hello: {},
  },
});

class HelloActor extends protocol.Actor {
  constructor(conn) {
    super(conn, helloSpec);
  }

  hello() {}
}
