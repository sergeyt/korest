(function(ko){

	var defaults = {
		options: {
			modelKey: 'ViewModel'
		}
	};

	ko.rest = function(obj, options) {
		if (!isObject(obj)) {
			throw new Error("Input object is required.");
		}
		if (!isObject(options)) {
			throw new Error("Options are not specified.");
		}
		if (typeof options.url != 'string' || !options.url) {
			throw new Error("Missing required url option.");
		}

		options = $.extend({}, defaults.options, options);

		var root;

		// deep update when response has the whole model
		options.fullUpdate = function(res) {
			if (res !== null && res.hasOwnProperty(options.modelKey)) {
				root.update(res[options.modelKey]);
				return true;
			}
			return false;
		};

		root = wrap_object(obj, options);

		return root;
	};

	function wrap_object(obj, options) {
		var wrapper = {};

		Object.keys(obj).forEach(function(key) {
			var val = obj[key];
			var opts = append_url(options, key);
			wrapper[key] = wrap_value(val, opts);
		});

		wrapper.update = function(obj) {
			update_object(wrapper, obj);
		};

		wrapper.fetch = function() {
			return ajax('GET', options.url).done(function(obj) {
				update_object(wrapper, obj);
				return obj;
			});
		};

		wrapper.unwrap = function(){
			return unwrap_object(wrapper);
		};

		return wrapper;
	}

	function unwrap_object(wrapper) {
		var obj = {};
		Object.keys(wrapper).forEach(function(key) {
			var val = wrapper[key];
			if ($.isFunction(val.unwrap)) {
				obj[key] = val.unwrap();
			} else if (!$.isFunction(val)) {
				obj[key] = val;
			}
		});
		return obj;
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

		var property;

		function get_value() {
			return property.field();
		}

		function set_value(newValue) {
			if (property.field() === newValue) return $.Deferred().resolve(newValue).promise();
			return ajax('UPDATE', options.url, {value: newValue}).then(function(res) {
				if (options.fullUpdate(res)) return res;
				property.field(newValue);
				property.error('');
				return res;
			}).fail(function(xhr, status, err) {
				property.error(xhr_error(xhr, err));
			});
		}

		property = ko.computed({
			read: get_value,
			write: set_value,
			deferEvaluation: true
		});

		property.field = ko.observable(value);
		property.error = ko.observable('');
		property.get = get_value;
		property.set = set_value;

		property.fetch = function() {
			return ajax('GET', options.url).then(function(val) {
				property.field(val);
				property.error('');
				return val;
			}).fail(function(xhr, status, err){
				property.error(xhr_error(xhr, err));
			});
		};

		property.update = function(newValue) {
			property.field(newValue);
			property.error('');
			return newValue;
		};

		property.unwrap = function() {
			return property.field();
		};

		return property;
	}

	function wrap_array(array, options) {
		var items = ko.observableArray();
		var error = ko.observable('');

		items.error = error;

		// TODO support insert operation

		items.add = function(args) {
			return ajax('PUT', options.url, args).then(function(res) {
				if (options.fullUpdate(res)) return res;
				items.push(wrap_item(items, res, items.length, options));
				return res;
			}).fail(function(xhr, status, err) {
				error(xhr_error(xhr, err));
			});
		};

		items.removeAt = function(index) {
			var url = combine_url(options.url, index);
			return ajax('DELETE', url).then(function(res) {
				if (options.fullUpdate(res)) return res;
				items.splice(index, 1);
				return res;
			}).fail(function(xhr, status, err) {
				error(xhr_error(xhr, err));
			});
		};

		function update_item(newItem, index) {
			var underlyingArray = items.peek();
			var item = underlyingArray[index];
			if (isObject(item) && $.isFunction(item.update)) {
				item.update(newItem);
			} else {
				// primitive value, just replace
				underlyingArray[index] = newItem;
			}
		}

		items.update = function(array) {
			// update existing items
			var len = items().length, i = 0;
			for (; i < array.length && i < len; i++) {
				update_item(array[i], i);
			}
			if (len > array.length) {
				items.splice(array.length, len - array.length);
			} else if (array.length > len) {
				for (i = len; i < array.length; i++) {
					items.push(wrap_item(items, array[i], i, options));
				}
			} else {
				items.valueHasMutated();
			}
		};

		items.fetch = function() {
			return ajax('GET', options.url).then(function(array){
				items.update(array);
				return array;
			}).then(function(xhr, status, err){
				error(xhr_error(xhr, err));
			});
		};

		items.unwrap = function() {
			return items.peek().map(function(item) {
				if (isObject(item) && $.isFunction(item.unwrap)) {
					return item.unwrap();
				} else {
					return item;
				}
			});
		};

		// add and wrap existing items
		array.forEach(function(item, index) {
			items.push(wrap_item(items, item, index, options));
		});

		return items;
	}

	function wrap_item(items, item, index, options) {
		// do not wrap primitive arrays
		if (isObject(item)) {
			var opts = append_url(options, index);
			var wrapper = wrap_object(item, opts);

			wrapper.remove = function() {
				return items.removeAt(index);
			};

			return wrapper;
		}
		return item;
	}

	// updates observable fields
	function update_object(wrapper, obj) {
		Object.keys(wrapper).forEach(function(key) {
			if (obj.hasOwnProperty(key)) {
				var cur = wrapper[key];
				var val = obj[key];
				if ($.isFunction(cur.update)) {
					cur.update(val);
				}
			} else if ($.isFunction(wrapper[key])) {
				// preserve functions
			} else {
				// TODO custom handler
				delete wrapper[key];
			}
		});
	}

	function ajax(verb, url, data) {
		var req = {
			type: verb,
			url: url
		};

		if (data) {
			req = $.extend(req, {
				contentType: "application/json",
				data: JSON.stringify(data),
				dataType: 'json'
			});
		}

		return $.ajax(req).then(function(res) {
			// unwrap d
			if (res.hasOwnProperty('d')) {
				res = res.d;
				// try to parse JSON
				if (typeof res == "string") {
					try {
						res = JSON.parse(res);
					} catch (err) {
					}
				}
			}
			return res;
		});
	}

	function xhr_error(xhr, err) {
		if (xhr && xhr.status) {
			if (xhr.responseJSON) {
				var d = xhr.responseJSON.d ? xhr.responseJSON.d : xhr.responseJSON;
				var msg = d.Message || d.Error || d.error;
				if (msg) {
					return msg;
				}
			}
			if (xhr.responseText) {
				var m = (/<title>([^<]*)<\/title>/).exec(xhr.responseText);
				if (m) {
					return m[1];
				}
			}
			return xhr.statusText;
		}
		return err;
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
