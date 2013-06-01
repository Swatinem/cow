# cow

copy on write deep, cyclic js objects

[![Build Status](https://travis-ci.org/Swatinem/cow.png?branch=master)](https://travis-ci.org/Swatinem/cow)
[![Coverage Status](https://coveralls.io/repos/Swatinem/cow/badge.png?branch=master)](https://coveralls.io/r/Swatinem/cow)
[![Dependency Status](https://gemnasium.com/Swatinem/cow.png)](https://gemnasium.com/Swatinem/cow)

## Installation

    $ npm install cow

## usage

Suppose we have a deep object tree with multiple references and cycles `root`
Now we want to make a copy of a `single` or `multiple` objects embedded in
that tree and have all the objects that somehow point to that objects be
copied as well.


Also note that the copy correctly preserves the objects inheritance and
hidden/accessor properties.
```js
var copies = cow({root: root, single: single});
copies[0]; // is the new root node
copies[1]; // is the copy of the single leaf object

var copies = cow({root: root, multiple: [leaf1, leaf2]});
copies[1][0]; // is a copy of leaf1
copies[1][1]; // is a copy of leaf2
```

## License

  LGPLv3

