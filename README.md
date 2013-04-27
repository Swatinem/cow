# cow

copy on write deep, cyclic js objects

## Installation

    $ npm install cow

## usage

If you have an object `root` which is deeply nested, has multiple references and
cycles and want to modify one of the sub objects, say `root.obj` without making
a deep copy of `root`, you can do so with a simple `cow(root, obj)`
which returns a new `root` and creates copies for all the objects between `root`
and `obj`, taking care of references and cycles.

Also note that the copy correctly preserves the objects inheritance and
hidden/accessor properties.

## License

  GPLv3

