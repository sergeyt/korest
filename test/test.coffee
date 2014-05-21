describe 'ko.rest', ->

	it 'requires input object', ->
		(-> ko.rest()).should.throw();
		(-> ko.rest null).should.throw();
		(-> ko.rest 'test').should.throw();
		(-> ko.rest false).should.throw();
		(-> ko.rest true).should.throw();
		(-> ko.rest 1).should.throw();

	it 'requires options', ->
		(-> ko.rest {}).should.throw();
		(-> ko.rest {}, null).should.throw();
		(-> ko.rest {}, 'test').should.throw();
		(-> ko.rest {}, false).should.throw();
		(-> ko.rest {}, true).should.throw();
		(-> ko.rest {}, 1).should.throw();

	it 'requires url option', ->
		(-> ko.rest {}, {}).should.throw();

	describe 'should wrap', ->
		it 'simple object', ->
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model'}
			ko.isObservable(m.name).should.be.true;
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model/'}
			ko.isObservable(m.name).should.be.true;

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			m = ko.rest obj, {url: '/model'}
			ko.isObservable(m.info.name).should.be.true;

		it 'simple array', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			ko.isObservable(m.items).should.be.true;
			m.items().should.eql ['test']

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			m = ko.rest obj, {url: '/model'}
			ko.isObservable(m.items).should.be.true;
			m.items().length.should.eql(1)
			ko.isObservable(m.items()[0].value).should.be.true;
			m.items()[0].value().should.eql 'test'

	describe 'should unwrap', ->
		it 'simple object', ->
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model'}
			m.unwrap().should.eql obj

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			m = ko.rest obj, {url: '/model'}
			m.unwrap().should.eql obj

		it 'simple array', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.unwrap().should.eql obj

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			m = ko.rest obj, {url: '/model'}
			m.unwrap().should.eql obj

	describe 'should update', ->
		it 'simple object', ->
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model'}
			m.update {name: 'new'}
			m.name().should.eql 'new'

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			m = ko.rest obj, {url: '/model'}
			m.update {info: {name: 'new'}}
			m.info.name().should.eql 'new'

		it 'simple array', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.items.update ['a', 'b']
			m.items().should.eql ['a', 'b']
			m.items.update ['c']
			m.items().should.eql ['c']
			m.items.update ['d']
			m.items().should.eql ['d']

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			m = ko.rest obj, {url: '/model'}
			m.update {items: [{value: 'a'}, {value: 'b'}]}
			m.items().length.should.eql(2)
			m.items()[0].value().should.eql 'a'
			m.items()[1].value().should.eql 'b'

	describe 'should call $.ajax', ->
		oldAjax = $.ajax
		result = 'test'
		spy = null

		afterEach ->
			$.ajax = oldAjax;

		beforeEach ->
			spy = sinon.spy()
			$.ajax = ->
				spy.apply spy, [].slice.call(arguments)
				$.Deferred().resolve(result).promise()

		it 'using UPDATE verb', ->
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model'}
			m.name 'abc'
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql 'UPDATE'
			opts.url.should.eql '/model/name'

		it 'using PUT verb', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.items.add 'abc'
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql 'PUT'
			opts.url.should.eql '/model/items'

		it 'using DELETE verb', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.items.removeAt(0)
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql 'DELETE'
			opts.url.should.eql '/model/items/0'

	describe 'should sync', ->
		oldAjax = $.ajax
		result = 'test'

		afterEach ->
			$.ajax = oldAjax;

		beforeEach ->
			spy = sinon.spy()
			$.ajax = ->
				spy.apply spy, [].slice.call(arguments)
				$.Deferred().resolve(result).promise()

		it 'simple object', ->
			obj = {name: 'test'}
			result = {name: 'new'}
			m = ko.rest obj, {url: '/model'}
			m.sync()
			m.name().should.eql result.name

		it 'property', ->
			obj = {name: 'test'}
			result = 'new'
			m = ko.rest obj, {url: '/model'}
			m.name.sync()
			m.name().should.eql result

		it 'object with array', ->
			obj = {items: ['test']}
			result = {items: ['a', 'b']}
			m = ko.rest obj, {url: '/model'}
			m.sync()
			m.items().should.eql ['a', 'b']

		it 'array', ->
			obj = {items: ['test']}
			result = ['a', 'b']
			m = ko.rest obj, {url: '/model'}
			m.items.sync()
			m.items().should.eql ['a', 'b']
