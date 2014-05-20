(function(ko){

	var defaults = {
		options: {
			valueKey: 'Value',
			itemKey: 'Item',
			indexKey: 'Index'
		}
	};

	// TODO initial GET of model
	ko.rest = function(obj, options) {
		if (!isObject(obj)) {
			throw new Error("Input object is required.");
		}
		if (!isObject(options)) {
			throw new Error("Options are not specified.");
		}
		options = $.extend({}, defaults.options, options);
		return wrap_object(obj, options);
	};

	function wrap_object(obj, options) {
		var result = {};
		Object.keys(obj).forEach(function(key) {
			var val = obj[key];
			var opts = append_url(options, key);
			result[key] = wrap_value(val, opts);
		});
		return result;
	}

	function wrap_value(value, options) {
		if ($.isArray(value)) {
			return wrap_array(value, options);
		} else if (isObject(value)) {
			return wrap_object(value, options);
		} else {
			return wrap_property(value, options);
		}
	}

	function wrap_property(value, options) {
		var field = ko.observable(value);

		return ko.computed({
			read: function() {
				// TODO GET latest value from server
				return field();
			},
			write: function(newValue) {
				var data = make_obj(options.valueKey, newValue);
				ajax('UPDATE', options.url, data).then(function(d) {
					field(newValue);
					// TODO full update
				}).fail(function(error) {
					// TODO validation error
				});
			}
		});
	}

	function wrap_array(value, options) {
		var arr = ko.observableArray();

		arr.insert = function(item, index) {
			var data = make_obj(options.itemKey, item);
			data[options.indexKey] = index;
			return ajax('PUT', options.url, data).then(function(d) {
				// TODO full update
				arr.push(wrap_item(d.Item, arr.length));
			}).fail(function(error) {
				// TODO validation error
			});
		};

		arr.add = function(item) {
			return arr.insert(item, arr.length);
		};

		arr.removeAt = function(index) {
			var data = make_obj(options.indexKey, index);
			var url = combine_url(options.url, index);
			return ajax('DELETE', url, data).then(function(d) {
				// TODO full update
				arr.splice(index, 1);
			}).fail(function(error) {
				// TODO validation error
			});
		};

		// add and wrap existing items
		value.forEach(function(item, index){
			arr.push(wrap_item(item, index, options));
		});

		return arr;
	}

	function wrap_item(item, index, options) {
		// do not wrap primitive arrays
		if (isObject(item)) {
			var opts = append_url(options, index);
			return wrap_value(item, opts);
		}
		return item;
	}

	function ajax(verb, url, data) {
		return $.ajax({
			type: verb,
			url: url,
			contentType: "application/json",
			data: JSON.stringify(data),
			dataType: 'json'
		});
	}

	function make_obj(key, val) {
		var o = {};
		o[key] = val;
		return o;
	}

	function append_url(options, path) {
		var url = combine_url(options.url, path);
		return $.extend({}, options, {url: url});
	}

	function combine_url(base, path) {
		if (base.charAt(base.length - 1) == '/') {
			return base + path;
		}
		return base + '/' + path;
	}

	function isObject(value) {
		return value !== null && typeof value == 'object';
	}

})(typeof window.ko == 'undefined' ? window.ko = {} : window.ko);
