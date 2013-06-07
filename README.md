# Cow

Cow provides a completely transparent copy on write proxy to deep, cyclic
js objects.

[![Build Status](https://travis-ci.org/Swatinem/cow.png?branch=master)](https://travis-ci.org/Swatinem/cow)
[![Coverage Status](https://coveralls.io/repos/Swatinem/cow/badge.png?branch=master)](https://coveralls.io/r/Swatinem/cow)
[![Dependency Status](https://gemnasium.com/Swatinem/cow.png)](https://gemnasium.com/Swatinem/cow)

## Installation

    $ npm install cow

## usage

Also note that the copy correctly preserves the objects inheritance and
hidden/accessor properties.
```js
function Test() { this.child = {}; }
var obj = new Test(); // provided a normal js object, which
obj.child.obj = obj; // can contain cycles
obj.child2 = obj.child // and references

var cow = new Cow(obj);
var proxy = cow.proxy;

// the proxy has all the properties of obj!
proxy.child.obj === proxy;
proxy.child2 === proxy.child;

// we can write new properties
proxy.child3 = proxy; // even create new cycles!

// convert the proxy back to plain object:
var finished = cow.finish();
finished.child3 === finished;
finished.child.obj === finished;
finished.child === finished.child2;

// and it has left the original object untouched:
obj !== finished;
obj.child !== finished.child;
```

## License

  LGPLv3

