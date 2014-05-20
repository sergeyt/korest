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

	it 'should wrap object', ->
		obj = {name: 'test'}
		m = ko.rest obj, {url: '/model'}
		ko.isObservable(m.name).should.be.true;
		obj = {name: 'test'}
		m = ko.rest obj, {url: '/model/'}
		ko.isObservable(m.name).should.be.true;

	it 'should wrap nested object', ->
		obj = {info: {name: 'test'}}
		m = ko.rest obj, {url: '/model'}
		ko.isObservable(m.info.name).should.be.true;

	it 'should wrap simple array', ->
		obj = {items: ['test']}
		m = ko.rest obj, {url: '/model'}
		ko.isObservable(m.items).should.be.true;
		m.items().length.should.eql(1)
		m.items()[0].should.eql('test')

	it 'should wrap complex array', ->
		obj = {items: [{value: 'test'}]}
		m = ko.rest obj, {url: '/model'}
		ko.isObservable(m.items).should.be.true;
		m.items().length.should.eql(1)
		ko.isObservable(m.items()[0].value).should.be.true;
		m.items()[0].value().should.eql('test')

	describe 'ajax', ->
		oldAjax = $.ajax
		result = 'test'
		spy = null

		afterEach ->
			$.ajax = oldAjax;

		beforeEach ->
			spy = sinon.spy()
			$.ajax = ->
				spy.apply(spy, [].slice.call(arguments))
				$.Deferred().resolve(result).promise()

		it 'should call UPDATE', ->
			obj = {name: 'test'}
			m = ko.rest obj, {url: '/model'}
			m.name('abc')
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql('UPDATE')
			opts.url.should.eql('/model/name')

		it 'should call PUT', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.items.add('abc')
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql('PUT')
			opts.url.should.eql('/model/items')

		it 'should call DELETE', ->
			obj = {items: ['test']}
			m = ko.rest obj, {url: '/model'}
			m.items.removeAt(0)
			spy.calledOnce.should.be.true;
			opts = spy.args[0][0]
			opts.type.should.eql('DELETE')
			opts.url.should.eql('/model/items/0')
