
var Cow = require('../');
var should = require('should');

describe('Cow', function () {
	it('should transparently wrap the original object', function () {
		var o = {child: {a: 1, b: [1,2]}};
		var c = new Cow(o);
		var p = c.proxy;
		// FIXME: make this work somehow?: p.should.eql(o);
		p.child.a.should.eql(1);
		p.child.b[0].should.eql(1);
		('a' in p.child).should.be.ok;
	});
	it('should not copy when no modifications are made', function () {
		var o = {child: {a: 1, b: [1,2]}};
		var c = new Cow(o);
		var p = c.proxy;
		// access props:
		p.child.a.should.eql(1);
		p.child.b[0].should.eql(1);
		var f = c.finish();
		f.should.equal(o);
	});
	it('should make a copy when adding a property', function () {
		var o = {child: {a: 1, b: [1,2]}};
		var c = new Cow(o);
		var p = c.proxy;
		p.new = 'new';
		var f = c.finish();
		f.should.not.equal(o);
		f.new.should.eql('new');
	});
	it('should make a copy when deleting a property', function () {
		var o = {child: {a: 1, b: [1,2]}, deleting: true};
		var c = new Cow(o);
		var p = c.proxy;
		delete p.deleting;
		var f = c.finish();
		f.should.not.equal(o);
		should.not.exist(f.deleting);
	});
	it('should not copy unaffected siblings', function () {
		var o = {child: {a: 1, b: [1,2]}, deleting: true};
		var c = new Cow(o);
		var p = c.proxy;
		delete p.deleting;
		var f = c.finish();
		f.child.should.equal(o.child);
	});
	it('should copy the prototype chain correctly', function () {
		function T() {}
		var o = new T;
		var c = new Cow(o);
		var p = c.proxy;
		p.new = 'new';
		var f = c.finish();
		f.should.be.an.instanceof.T;
	});
	it('should handle references correctly', function () {
		var root = {};
		root.obj = {};
		root.obj2 = root.obj;
		root.obj.should.equal(root.obj2);
		var c = new Cow(root);
		var p = c.proxy;
		p.obj.new = 'new';
		var f = c.finish();
		f.obj.should.equal(f.obj2);
		f.obj.new.should.eql('new');
	});
	it('should handle cycles correctly', function () {
		var root = [];
		root.push(root);
		root[0].should.equal(root);
		var c = new Cow(root);
		var p = c.proxy;
		var child = {};
		p.push(child);
		var f = c.finish();
		f[1].should.equal(child);
		f[0].should.equal(f);
	});
	it('should copy property descriptors correctly', function () {
		var obj = {};
		Object.defineProperty(obj, 'a', {writable: false, configurable: false, value: 1});
		var c = new Cow(obj);
		var p = c.proxy;
		p.new = 'new';
		var f = c.finish();
		f.should.not.equal(obj);
		(function () {
			f.a = 2;
		}).should.throw;
	});
	it('should handle deep nesting and references', function () {
		var obj = {is: 'obj'};
		var sibling = {is: 'sibling'};
		var child = {obj: obj, sibling: sibling, is: 'child'};
		child.self = child;
		var root = {obj: obj, sibling: sibling, child: child, is: 'root'};
		var c = new Cow(root);
		var p = c.proxy;
		p.obj.new = 'new';
		var f = c.finish();
		f.should.not.equal(root);
		f.sibling.should.equal(sibling);
		f.child.should.not.equal(root.child);
		f.child.obj.should.not.equal(root.child.obj);
		f.child.sibling.should.equal(sibling);
	});
	it('should handle arrays well', function () {
		var obj = {is: 'obj'};
		var arr = [obj, obj, obj];
		var prop = {is: 'prop'};
		arr.prop = prop;
		arr.is = 'arr';
		var root = {arr: arr, is: 'root'};
		var c = new Cow(root);
		var p = c.proxy;
		p.arr[0].new = 'new';
		var f = c.finish();
		f.arr.should.not.equal(arr);
		f.arr[0].should.not.equal(obj);
		f.arr[0].should.equal(f.arr[2]);
		f.arr.prop.should.equal(arr.prop);
	});
	it('should handle newly created cycles', function () {
		var o = {child: {a: 1, b: [1,2]}};
		var c = new Cow(o);
		var p = c.proxy;
		p.child.new = p.child;
		p.child.new2 = {child: p.child, child2: {}};
		p.child.new2.child2.child2 = p.child.new2.child2;
		var f = c.finish();
		f.child.should.not.equal(o.child);
		f.child.new.should.equal(f.child);
		f.child.new2.child.should.equal(f.child);
	});
});
