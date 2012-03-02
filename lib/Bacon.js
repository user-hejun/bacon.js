(function() {
  var Bacon, Dispatcher, End, EventStream, Initial, Next, Property, empty, end, head, initial, next, remove, tail,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.fn.asEventStream = function(eventName) {
      var element;
      element = this;
      return new EventStream(function(sink) {
        return element[eventName](function(event) {
          return sink(event);
        });
      });
    };
  }

  Bacon = this.Bacon = {
    taste: "delicious"
  };

  Bacon.noMore = "veggies";

  Bacon.more = "moar bacon!";

  Bacon.later = function(delay, value) {
    return new EventStream((function(sink) {
      var push;
      push = function() {
        sink(next(value));
        return sink(end());
      };
      return setTimeout(push(delay));
    }));
  };

  Bacon.sequentially = function(delay, values) {
    return new EventStream((function(sink) {
      var push, schedule;
      schedule = function(xs) {
        if (empty(xs)) {
          return sink(end());
        } else {
          return setTimeout((function() {
            return push(xs);
          }), delay);
        }
      };
      push = function(xs) {
        var reply;
        reply = sink(next(head(xs)));
        if (reply !== Bacon.noMore) return schedule(tail(xs));
      };
      return schedule(values);
    }));
  };

  Bacon.pushStream = function() {
    var d, pushStream;
    d = new Dispatcher;
    pushStream = d.toEventStream();
    pushStream.push = function(event) {
      return d.push(next(event));
    };
    pushStream.end = function() {
      return d.push(end());
    };
    return pushStream;
  };

  Next = (function() {

    function Next(value) {
      this.value = value;
    }

    Next.prototype.isEnd = function() {
      return false;
    };

    Next.prototype.isInitial = function() {
      return false;
    };

    return Next;

  })();

  Initial = (function(_super) {

    __extends(Initial, _super);

    function Initial() {
      Initial.__super__.constructor.apply(this, arguments);
    }

    Initial.prototype.isInitial = function() {
      return true;
    };

    Initial.prototype.isEnd = function() {
      return false;
    };

    return Initial;

  })(Next);

  End = (function() {

    function End() {}

    End.prototype.isEnd = function() {
      return true;
    };

    End.prototype.isInitial = function() {
      return false;
    };

    return End;

  })();

  initial = function(value) {
    return new Initial(value);
  };

  next = function(value) {
    return new Next(value);
  };

  end = function() {
    return new End();
  };

  EventStream = (function() {

    function EventStream(subscribe) {
      this.subscribe = new Dispatcher(subscribe).subscribe;
    }

    EventStream.prototype.filter = function(f) {
      return this.withHandler(function(event) {
        if (event.isEnd() || f(event.value)) {
          return this.push(event);
        } else {
          return Bacon.more;
        }
      });
    };

    EventStream.prototype.takeWhile = function(f) {
      return this.withHandler(function(event) {
        if (event.isEnd() || f(event.value)) {
          return this.push(event);
        } else {
          this.push(end());
          return Bacon.noMore;
        }
      });
    };

    EventStream.prototype.map = function(f) {
      return this.withHandler(function(event) {
        if (event.isEnd()) {
          return this.push(event);
        } else {
          return this.push(next(f(event.value)));
        }
      });
    };

    EventStream.prototype.merge = function(right) {
      var left;
      left = this;
      return new EventStream(function(sink) {
        var ends, smartSink;
        ends = 0;
        smartSink = function(event) {
          if (event.isEnd()) {
            ends++;
            if (ends === 2) {
              return sink(end());
            } else {
              return Bacon.more;
            }
          } else {
            return sink(event);
          }
        };
        left.subscribe(smartSink);
        return right.subscribe(smartSink);
      });
    };

    EventStream.prototype.toProperty = function(initValue) {
      return new Property(this, initValue);
    };

    EventStream.prototype.withHandler = function(handler) {
      return new Dispatcher(this.subscribe, handler).toEventStream();
    };

    EventStream.prototype.toString = function() {
      return "EventStream";
    };

    return EventStream;

  })();

  Property = (function() {

    function Property(stream, initValue) {
      var currentValue, d, handleEvent;
      currentValue = initValue;
      handleEvent = function(event) {
        if (!event.isEnd) currentValue = event.value;
        return this.push(event);
      };
      d = new Dispatcher(stream.subscribe, handleEvent);
      this.subscribe = function(sink) {
        if (currentValue != null) sink(initial(currentValue));
        return d.subscribe(sink);
      };
    }

    return Property;

  })();

  Dispatcher = (function() {

    function Dispatcher(subscribe, handleEvent) {
      var sinks,
        _this = this;
      if (subscribe == null) subscribe = function(event) {};
      sinks = [];
      this.push = function(event) {
        var reply, sink, _i, _len;
        for (_i = 0, _len = sinks.length; _i < _len; _i++) {
          sink = sinks[_i];
          reply = sink(event);
          if (reply === Bacon.end) remove(sink, sinks);
        }
        if (sinks.length > 0) {
          return Bacon.more;
        } else {
          return Bacon.end;
        }
      };
      if (handleEvent == null) {
        handleEvent = function(event) {
          return this.push(event);
        };
      }
      this.handleEvent = function(event) {
        return handleEvent.apply(_this, [event]);
      };
      this.subscribe = function(sink) {
        sinks.push(sink);
        if (sinks.length === 1) return subscribe(_this.handleEvent);
      };
    }

    Dispatcher.prototype.toEventStream = function() {
      return new EventStream(this.subscribe);
    };

    Dispatcher.prototype.toString = function() {
      return "Dispatcher";
    };

    return Dispatcher;

  })();

  empty = function(xs) {
    return xs.length === 0;
  };

  head = function(xs) {
    return xs[0];
  };

  tail = function(xs) {
    return xs.slice(1, xs.length);
  };

  remove = function(x, xs) {
    var i;
    i = xs.indexOf(x);
    if (i >= 0) return xs.splice(i, 1);
  };

}).call(this);