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
			model = ko.rest obj, {url: '/model'}
			ko.isObservable(model.name).should.be.true
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model/'}
			ko.isObservable(model.name).should.be.true

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			model = ko.rest obj, {url: '/model'}
			ko.isObservable(model.info.name).should.be.true

		it 'simple array', ->
			obj = {items: ['test']}
			model = ko.rest obj, {url: '/model'}
			ko.isObservable(model.items).should.be.true
			model.items().should.eql ['test']

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			model = ko.rest obj, {url: '/model'}
			ko.isObservable(model.items).should.be.true
			model.items().length.should.eql(1)
			ko.isObservable(model.items()[0].value).should.be.true
			model.items()[0].value().should.eql 'test'

	describe 'should unwrap', ->
		it 'simple object', ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			model.unwrap().should.eql obj

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			model = ko.rest obj, {url: '/model'}
			model.unwrap().should.eql obj

		it 'simple array', ->
			obj = {items: ['test']}
			model = ko.rest obj, {url: '/model'}
			model.unwrap().should.eql obj

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			model = ko.rest obj, {url: '/model'}
			model.unwrap().should.eql obj

	describe 'should update', ->
		it 'simple object', ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			model.update {name: 'new'}
			model.name().should.eql 'new'

		it 'nested object', ->
			obj = {info: {name: 'test'}}
			model = ko.rest obj, {url: '/model'}
			model.update {info: {name: 'new'}}
			model.info.name().should.eql 'new'

		it 'simple array', ->
			obj = {items: ['test']}
			model = ko.rest obj, {url: '/model'}
			model.items.update ['a', 'b']
			model.items().should.eql ['a', 'b']
			model.items.update ['c']
			model.items().should.eql ['c']
			model.items.update ['d']
			model.items().should.eql ['d']

		it 'complex array', ->
			obj = {items: [{value: 'test'}]}
			model = ko.rest obj, {url: '/model'}
			model.update {items: [{value: 'a'}, {value: 'b'}]}
			model.items().length.should.eql(2)
			model.items()[0].value().should.eql 'a'
			model.items()[1].value().should.eql 'b'

	describe 'should call $.ajax', ->
		oldAjax = $.ajax
		result = 'test'
		spy = null

		afterEach ->
			$.ajax = oldAjax

		beforeEach ->
			spy = sinon.spy()
			$.ajax = ->
				spy.apply spy, [].slice.call(arguments)
				$.Deferred().resolve(result).promise()

		it 'using UPDATE verb', ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			model.name 'abc'
			spy.calledOnce.should.be.true
			opts = spy.args[0][0]
			opts.type.should.eql 'UPDATE'
			opts.url.should.eql '/model/name'

		it 'using PUT verb', ->
			obj = {items: ['test']}
			model = ko.rest obj, {url: '/model'}
			model.items.add 'abc'
			spy.calledOnce.should.be.true
			opts = spy.args[0][0]
			opts.type.should.eql 'PUT'
			opts.url.should.eql '/model/items'

		it 'using DELETE verb', ->
			obj = {items: ['test']}
			model = ko.rest obj, {url: '/model'}
			model.items.removeAt(0)
			spy.calledOnce.should.be.true
			opts = spy.args[0][0]
			opts.type.should.eql 'DELETE'
			opts.url.should.eql '/model/items/0'

	describe 'should fetch', ->
		oldAjax = $.ajax
		result = 'test'

		afterEach ->
			$.ajax = oldAjax

		beforeEach ->
			$.ajax = ->
				$.Deferred().resolve(result).promise()

		it 'simple object', ->
			obj = {name: 'test'}
			result = {name: 'new'}
			model = ko.rest obj, {url: '/model'}
			model.fetch()
			model.name().should.eql result.name

		it 'property', ->
			obj = {name: 'test'}
			result = 'new'
			model = ko.rest obj, {url: '/model'}
			model.name.fetch()
			model.name().should.eql result

		it 'object with array', ->
			obj = {items: ['test']}
			result = {items: ['a', 'b']}
			model = ko.rest obj, {url: '/model'}
			model.fetch()
			model.items().should.eql ['a', 'b']

		it 'array', ->
			obj = {items: ['test']}
			result = ['a', 'b']
			model = ko.rest obj, {url: '/model'}
			model.items.fetch()
			model.items().should.eql ['a', 'b']

	describe 'property', ->
		oldAjax = $.ajax
		result = $.Deferred().resolve('test').promise()
		model = null

		beforeEach ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			$.ajax = -> result

		afterEach ->
			result = $.Deferred().resolve('test').promise()
			$.ajax = oldAjax

		it 'should have observable error', ->
			ko.isObservable(model.name.error).should.be.true
			model.name.error().should.eql('')

		it 'setter should be thenable', ->
			for _ in [0..1]
				spy = sinon.spy()
				model.name.set('value').then spy
				spy.calledOnce.should.be.true

		it 'should set error on failed write', ->
			result = $.Deferred().reject({}, 'error', 'error')
			model.name 'error'
			model.name.error().should.eql('error')

	describe 'property should reset error', ->
		oldAjax = $.ajax
		model = null

		beforeEach ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			model.name.error 'error'
			$.ajax = ->
				$.Deferred().resolve('test').promise()

		afterEach ->
			$.ajax = oldAjax

		it 'on successful write', ->
			model.name.set 'ok'
			model.name.error().should.eql ''

		it 'on update', ->
			model.name.update 'ok'
			model.name.error().should.eql ''

		it 'on fetch', ->
			model.name.fetch()
			model.name.error().should.eql ''

	describe 'property should set error from AJAX request', ->
		oldAjax = $.ajax
		err = 'test error'

		afterEach ->
			$.ajax = oldAjax

		test = (d) ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}

			$.ajax = ->
				$.Deferred().reject({status: 'error', responseJSON: d}, 'error', 'error').promise();
			model.name.set 'a'
			model.name.error().should.eql err

			$.ajax = ->
				$.Deferred().resolve(d).promise();
			model.name.set 'b'
			model.name.error().should.eql err

		it 'Error or d.Error', ->
			test {Error: err}
			test {d:{Error: err}}

		it 'error or d.error', ->
			test {error: err}
			test {d:{error: err}}

	describe 'property should set error from xhr.responseText', ->
		oldAjax = $.ajax
		text = ''
		model = null

		beforeEach ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			$.ajax = ->
				$.Deferred().reject({status: 'error', responseText: text}, 'error', 'error').promise()

		afterEach ->
			$.ajax = oldAjax

		it 'html title', ->
			msg = 'internal error'
			text = "<title>#{msg}</title>"
			model.name.set 'error'
			model.name.error().should.eql msg

	describe 'full-update', ->
		oldAjax = $.ajax
		result = {}
		model = null

		beforeEach ->
			obj = {name: 'test'}
			model = ko.rest obj, {url: '/model'}
			$.ajax = ->
				$.Deferred().resolve(result).promise()

		afterEach ->
			result = {}
			$.ajax = oldAjax

		it 'on ViewModel response should update model', ->
			result = {d: JSON.stringify {ViewModel:{name: 'name'}}}
			spy = sinon.spy()
			up = model.update;
			model.update = (obj) ->
				spy obj
				up obj
			model.name('val')
			model.name().should.eql('name')
			spy.calledOnce.should.be.true
