_dispatch: function(e) {
  try {
    var a = JSON.parse(e.data)
  } catch (ex) {
    console.warn("postmessage data invalid json: ", ex);
    return
  }
  if (!a.type) {
    console.warn("postmessage message type required");
    return
  }
  var b = n.data("callbacks.postmessage") || {},
    cb = b[a.type];
  if (cb) {
    cb(a.data)
  } else {
    var l = n.data("listeners.postmessage") || {};
    var c = l[a.type] || [];
    for (var i = 0, len = c.length; i < len; i++) {
      var o = c[i];
      if (o.origin && e.origin !== o.origin) {
        console.warn("postmessage message origin mismatch", e.origin, o.origin);
        if (a.errback) {
          var d = {
            message: "postmessage origin mismatch",
            origin: [e.origin, o.origin]
          };
          n.send({
            target: e.source,
            data: d,
            type: a.errback
          })
        }
        continue
      }
      try {
        var r = o.fn(a.data);
        if (a.callback) {
          n.send({
            target: e.source,
            data: r,
            type: a.callback
          })
        }
      } catch (ex) {
        if (a.errback) {
          n.send({
            target: e.source,
            data: ex,
            type: a.errback
          })
        }
      }
    }
  }
}
