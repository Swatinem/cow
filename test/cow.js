var cow = require('../');

describe('cow', function () {
	it('should not copy the root if the object is not found', function () {
		var root = {};
		var obj = {};
		cow(root, obj).should.equal(root);
	});
	it('should copy the object itself', function () {
		var root = {};
		cow(root, root).should.not.equal(root);
	});
	it('should make a copy of the parent', function () {
		var obj = {};
		var root = {obj: obj};
		var cowed = cow(root, obj);
		cowed.should.not.equal(root);
		cowed.obj.should.not.equal(obj);
	});
	it('should not copy unaffected siblings', function () {
		var obj = {};
		var sibling = {};
		var root = {obj: obj, sibling: sibling};
		var cowed = cow(root, obj);
		cowed.should.not.equal(root);
		cowed.sibling.should.equal(sibling);
	});
	it('should copy the prototype chain correctly', function () {
		function T() {}
		var root = new T;
		root.obj = {};
		var cowed = cow(root, root.obj);
		cowed.should.not.equal(root);
		cowed.should.be.an.instanceof.T;
	});
	it('should handle references correctly', function () {
		var root = {};
		root.obj = {};
		root.obj2 = root.obj;
		root.obj.should.equal(root.obj2);
		var cowed = cow(root, root.obj);
		cowed.should.not.equal(root);
		cowed.obj.should.not.equal(root.obj);
		cowed.obj.should.equal(cowed.obj2);
	});
	it('should handle cycles correctly', function () {
		var root = [];
		root.push(root);
		root[0].should.equal(root);
		root.push({});
		var cowed = cow(root, root[1]);
		cowed.should.not.equal(root);
		cowed[1].should.not.equal(root[1]);
		cowed[0].should.equal(cowed[0]);
	});
	it('should copy property descriptors correctly', function () {
		var obj = {};
		Object.defineProperty(obj, 'a', {writable: false, configurable: false, value: 1});
		var cowed = cow(obj, obj);
		cowed.should.not.equal(obj);
		(function () {
			cowed.a = 2;
		}).should.throw;
	});
	it('should handle deep nesting and references', function () {
		var obj = {is: 'obj'};
		var sibling = {is: 'sibling'};
		var child = {obj: obj, sibling: sibling, is: 'child'};
		child.self = child;
		var root = {obj: obj, sibling: sibling, child: child, is: 'root'};
		var cowed = cow(root, obj);
		cowed.should.not.equal(root);
		cowed.sibling.should.equal(sibling);
		cowed.child.should.not.equal(root.child);
		cowed.child.obj.should.not.equal(root.child.obj);
		cowed.child.sibling.should.equal(sibling);
	});
	it('should handle arrays well', function () {
		var obj = {is: 'obj'};
		var arr = [obj, obj, obj];
		var prop = {is: 'prop'};
		arr.prop = prop;
		arr.is = 'arr';
		var root = {arr: arr, is: 'root'};
		var cowed = cow(root, obj);
		cowed.arr.should.not.equal(arr);
		cowed.arr[0].should.not.equal(obj);
		cowed.arr[0].should.equal(cowed.arr[2]);
		cowed.arr.prop.should.equal(arr.prop);
	});
});
