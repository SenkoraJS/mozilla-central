var timer;
var callback;

function handleRequest(request, response) {
  if (request.queryString.includes("trigger")) {
    setState("triggered", "triggered");
    response.setHeader("Cache-Control", "no-cache", false);
    response.setHeader("Content-Type", "text/javascript; charset=utf-8", false);
    response.write(";");
  } else {
    // Reset the state when running more than once in same browser session.
    setState("triggered", "");

    response.processAsync();
    response.setHeader("Cache-Control", "no-cache", false);
    response.setHeader("Content-Type", "text/html; charset=utf-8", false);
    response.write("<table><tr><td>A</td>     ");
    response.bodyOutputStream.flush();
    timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

    callback = function () {
      if (getState("triggered") == "triggered") {
        response.write("<td>B</td></tr></table>");
        response.finish();
      } else {
        timer.initWithCallback(callback, 10, Ci.nsITimer.TYPE_ONE_SHOT);
      }
    };
    timer.initWithCallback(callback, 10, Ci.nsITimer.TYPE_ONE_SHOT);
  }
}
