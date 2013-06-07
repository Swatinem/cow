
var Proxy = require('harmony-proxy');

module.exports = Cow;

// v8 fail: there is NO WAI to enumerate a map or a set :-(

/**
 * Creates a new completely transparent copy-on-write Proxy object
 * which is then available in `.proxy`
 * Call `.finish()` to actually resolve this back to native objects
 */
function Cow(root) {
	this._proxyMap = new Map();
	this._proxies = []; // v8 fail
	this._root = root;
	this.proxy = this._makeProxy(root).proxy;
}

Cow.prototype._makeProxy = function Cow__makeProxy(target) {
	var self = this;
	var proxy = new Proxy(target, {
		get: function (target, name, receiver) {
			if (name in sets)
				return sets[name];
			var value = target[name];
			// we don’t do anything for non-object props or props of the prototype
			if (!Object.prototype.hasOwnProperty.call(target, name) ||
			    !value || typeof value !== 'object')
				return value;
			// create a new transparent proxy attribute
			var proxy = self._proxyMap.get(value);
			if (!proxy)
				proxy = self._makeProxy(value);
			return proxy.proxy;
		},
		set: function (target, name, value, receiver) {
			delete deletes[name];
			sets[name] = value;
			return true;
		},
		deleteProperty: function (target, name) {
			delete sets[name];
			if (name in target)
				deletes[name] = true;
			return true;
		},
		has: function (target, name) {
			return (name in sets) || (name in target) && !(name in deletes);
		}
	});
	var sets = {};
	var deletes = {}; // v8 fail
	proxy = {
		target: target,
		proxy: proxy,
		sets: sets,
		deletes: deletes
	};
	self._proxyMap.set(target, proxy);
	self._proxies.push(proxy);
	return proxy;
};

Cow.prototype.finish = function Cow_finish() {
	var self = this;
	var modified = self._proxies.filter(function (proxy) {
		return Object.keys(proxy.sets).length || Object.keys(proxy.deletes).length;
	}).map(function (proxy) { return proxy.target; });
	if (!modified.length)
		return self._root;

	var parents = getParents(self._root);
	var copies = new Map();
	var proxyCopies = new Map();
	var seen = new Set();

	// first make a copy of the objects themselves
	modified.forEach(copyObj);
	// then copy over all the props
	modified.forEach(copyProps);

	return copies.get(self._root) || self._root;

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
		// a property in the new subtree might reference a proxy object
		var proxy = self._proxyMap.get(obj);
		if (proxy)
			proxyCopies.set(proxy.proxy, copied);
		parents.get(obj).forEach(copyObj);
	}
	/**
	 * make shallow copies of the properties, making sure to take care of
	 * already copied children, recursing to parents
	 */
	function copyProps(obj) {
		// avoid cycles
		if (seen.has(obj))
			return;
		seen.add(obj);
		var copied = copies.get(obj);
		var proxy = self._proxyMap.get(obj);
		var props = Object.getOwnPropertyNames(obj);
		props.forEach(function (prop) {
			// the property was deleted or modified; don’t bother copying it
			if (proxy && (prop in proxy.deletes || prop in proxy.sets))
				return;
			var propdesc = Object.getOwnPropertyDescriptor(obj, prop);
			var value = propdesc.value;
			if (copies.has(value))
				propdesc.value = copies.get(value);
			Object.defineProperty(copied, prop, propdesc);
		});
		// add modified or added properties:
		proxy && Object.keys(proxy.sets).forEach(function (prop) {
			// FIXME: what does actually happen when we try to set a setter?
			// walk the new subtree for references to proxy objects
			copied[prop] = replaceProxies(proxy.sets[prop]);
		});
		parents.get(obj).forEach(copyProps);
	}
	/**
	 * a property in the new subtree might reference a proxy object.
	 * replace those references with an extra pass
	 */
	function replaceProxies(obj) {
		if (typeof obj !== 'object')
			return obj;
		var copied = proxyCopies.get(obj);
		if (copied)
			return copied;
		var props = Object.getOwnPropertyNames(obj);
		props.forEach(function (prop) {
			var copied = proxyCopies.get(obj[prop]);
			if (copied)
				return obj[prop] = copied;
			// else
			replaceProxies(obj[prop]);
		});
		return obj;
	}
};

/**
 * Walk the root and make a map of object -> [parents]
 */
function getParents(obj) {
	var seen = new Set();
	var parents = new Map();
	parents.set(obj, []);

	walk(obj);

	return parents;

	function walk(obj) {
		// avoid cycles
		if (seen.has(obj))
			return;
		seen.add(obj);

		var props = Object.getOwnPropertyNames(obj);
		props.forEach(function (prop) {
			var propdesc = Object.getOwnPropertyDescriptor(obj, prop);
			var value = propdesc.value;
			// only objects and arrays are of interest
			if (!value || typeof value != 'object')
				return;
			var parent = parents.get(value);
			if (!parent) {
				parent = [];
				parents.set(value, parent);
			}
			if (!~parent.indexOf(obj))
				parent.push(obj);
			walk(value);
		});
	}
}

