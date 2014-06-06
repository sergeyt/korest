/*
 * korest.js v0.0.7 - maps plain object into knockout observable with bound REST actions.
 * https://github.com/sergeyt/korest
 * Licensed under MIT (https://github.com/sergeyt/korest/blob/master/LICENSE)
 */

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
			// TODO set last __error__
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

		var field = ko.observable(value);
		var property;

		function get_value() {
			return field();
		}

		function set_value(newValue) {
			property.error('');
			if (field() === newValue) {
				return $.Deferred().resolve(newValue).promise();
			}
			return ajax('UPDATE', options.url, {value: newValue}).then(function(res) {
				if (options.fullUpdate(res)) return res;
				field(newValue);
				return res;
			}).fail(function(err) {
				property.error(err);
			});
		}

		property = ko.computed({
			read: get_value,
			write: set_value,
			deferEvaluation: true
		});

		property.error = ko.observable('');
		property.get = get_value;
		property.set = set_value;

		property.fetch = function() {
			return ajax('GET', options.url).then(function(val) {
				field(val);
				property.error('');
				return val;
			}).fail(function(err){
				property.error(err);
			});
		};

		property.update = function(newValue) {
			field(newValue);
			property.error('');
			return newValue;
		};

		property.unwrap = function() {
			return field();
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
				items.push(wrap_item(items, res, items().length, options));
				return res;
			}).fail(function(err) {
				error(err);
			});
		};

		items.removeAt = function(index) {
			var url = combine_url(options.url, index);
			return ajax('DELETE', url).then(function(res) {
				if (options.fullUpdate(res)) return res;
				items.splice(index, 1);
				return res;
			}).fail(function(err) {
				error(err);
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
				// fake update to reset errors
				for (i = array.length; i < len; i++) {
					update_item(items()[i], i);
				}
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
			return ajax('GET', options.url).then(function(array) {
				items.update(array);
				return array;
			}).fail(function(err) {
				error(err);
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
			url: url,
			cache: false
		};

		if (data) {
			req = $.extend(req, {
				contentType: "application/json",
				data: JSON.stringify(data),
				dataType: 'json'
			});
		}

		return $.ajax(req).then(
			function(res) {
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
				if (res && (res.Error || res.error)) {
					return $.Deferred().reject(res.Error || res.error).promise();
				}
				return res;
			},
			function(xhr, status, err) {
				return resolve_error(xhr, err);
			});
	}

	function resolve_error(req, err) {
		if (req && req.status) {
			var json = req.responseJSON;
			if (json) {
				var d = json.d ? json.d : json;
				var msg = d.Error || d.error;
				if (msg) {
					return msg;
				}
			}
			var text = req.responseText;
			if (text) {
				var m = (/<title>([^<]*)<\/title>/).exec(text);
				return m ? m[1] : text;
			}
			return req.statusText;
		}
		return err;
	}

	function append_url(options, path) {
		var url = combine_url(options.url, path);
		return $.extend({}, options, {url: url});
	}

	function combine_url(url, path) {
		url = url || '';
		var qs = '';
		var i = url.indexOf('?');
		if (i >= 0) {
			qs = url.substr(i);
			url = url.substr(0, i);
		}
		if (url.charAt(url.length - 1) == '/') {
			return url + path + qs;
		}
		return url + '/' + path + qs;
	}

	function isObject(value) {
		return value !== null && typeof value == 'object';
	}

})(typeof window.ko == 'undefined' ? window.ko = {} : window.ko);
