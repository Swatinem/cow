
module.exports = cow;

/**
 * 
 */
function cow(root, obj) {
	var parents = getParents(root);
	// if the obj is not part of the root tree
	if (!parents.has(obj))
		parents.set(obj, []);
	var copies = new Map();
	var seen = [];

	// first make a copy of the objects themselves
	copyObj(obj);
	// then copy over all the props
	copyProps(obj);

	if (!copies.has(root))
		return root;
	return copies.get(root);

	/**
	 * makes a copy of the object without props, recursing to parents
	 */
	function copyObj(obj) {
		if (copies.has(obj))
			return;
		var copied;
		if (Array.isArray(obj))
			copied = [];
		else {
			var proto = Object.getPrototypeOf(obj);
			copied = Object.create(proto);
		}
		copies.set(obj, copied);
		parents.get(obj).forEach(copyObj);
	}
	/**
	 * make shallow copies of the properties, making sure to take care of
	 * already copied children, recursing to parents
	 */
	function copyProps(obj) {
		// avoid cycles
		if (~seen.indexOf(obj))
			return;
		seen.push(obj);
		var copied = copies.get(obj);
		var props = Object.getOwnPropertyNames(obj);
		props.forEach(function (prop) {
			var propdesc = Object.getOwnPropertyDescriptor(obj, prop);
			var value = propdesc.value;
			if (copies.has(value))
				propdesc.value = copies.get(value);
			Object.defineProperty(copied, prop, propdesc);
		});
		parents.get(obj).forEach(copyProps);
	}
};

/**
 * Walk the root and make a map of object -> [parents]
 */
function getParents(obj) {
	var seen = [];
	var parents = new Map();
	parents.set(obj, []);

	walk(obj);

	return parents;

	function walk(obj) {
		// avoid cycles
		if (~seen.indexOf(obj))
			return;
		seen.push(obj);

		var props = Object.getOwnPropertyNames(obj);
		props.forEach(function (prop) {
			var propdesc = Object.getOwnPropertyDescriptor(obj, prop);
			var value = propdesc.value;
			// only objects and arrays are of interest
			if (!value || typeof value != 'object')
				return;
			if (!parents.has(value))
				parents.set(value, []);
			var parent = parents.get(value);
			if (!~parent.indexOf(obj))
				parent.push(obj);
			walk(value);
		});
	}
}


function Map() {
	this.keys = [];
	this.values = [];
}
Map.prototype.has = function Map_has(key) {
	return ~this.keys.indexOf(key);
};
Map.prototype.get = function Map_get(key) {
	var index = this.keys.indexOf(key);
	return this.values[index];
};
Map.prototype.set = function Map_set(key, value) {
	var index = this.keys.indexOf(key);
	if (~index)
		return this.values[index] = value;
	this.keys.push(key);
	this.values.push(value);
};

