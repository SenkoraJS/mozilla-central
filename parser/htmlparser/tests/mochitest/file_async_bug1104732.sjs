var timer = null;

function handleRequest(request, response) {
  response.processAsync();
  response.setHeader("Content-Type", "application/javascript", false);
  response.write("asyncState = 'mid-async';\n");

  timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  timer.initWithCallback(
    function () {
      response.write("asyncState = 'loaded';\n");
      response.finish();
    },
    5 * 1000 /* milliseconds */,
    timer.TYPE_ONE_SHOT
  );
}
