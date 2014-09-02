[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Build Status](https://drone.io/github.com/sergeyt/korest/status.png)](https://drone.io/github.com/sergeyt/korest/latest)
                                                                                 
[![Deps Status](https://david-dm.org/sergeyt/korest.png)](https://david-dm.org/sergeyt/korest)
[![DevDeps Status](https://david-dm.org/sergeyt/korest/dev-status.png)](https://david-dm.org/sergeyt/korest#info=devDependencies)
[![Dependency Status](https://gemnasium.com/sergeyt/korest.svg)](https://gemnasium.com/sergeyt/korest)

[![NPM version](https://badge.fury.io/js/korest.png)](http://badge.fury.io/js/)
[![Bower version](https://badge.fury.io/bo/korest.svg)](http://badge.fury.io/bo/korest)

[![NPM](https://nodei.co/npm/korest.png?downloads=true&stars=true)](https://nodei.co/npm/korest/)

# korest

Function for [knockout.js](http://knockoutjs.com/) to map plain object into knockout observable with bound REST actions.
Similar to [knockout.mapping](https://github.com/SteveSanderson/knockout.mapping), but it is more simple and lightweight.

korest could be useful if you:

	* have server-stateful view model
	* have [REST](http://en.wikipedia.org/wiki/Representational_state_transfer) interface to the view model
	* don't want to manually write/sync client-side version of view model

## API

`ko.rest(obj, options)` - wraps given plain JS object into object with knockout observable fields bound to REST actions. `options`:
* `url` - specifies root url to REST resource.

Wrapper has the following methods.

* `unwrap():Object` - unwraps to plain JS object.
* `update(obj):void` - updates observable fields with values from given plain JS object.
* `fetch():promise` - fetches latest version of object from server.

## Example

Consider you have backend with the following REST interface:

```
GET 	/report 					- gets report view model
GET 	/report/width 				- gets report width
UPDATE 	/report/width 				- updates report width
GET 	/report/items 				- gets collection of report items
POST 	/report/items				- adds new report item
GET 	/report/items/{index}		- gets item at specified index
UPDATE 	/report/items/{index}		- updates item at specified index
DELETE  /report/items/{index}		- updates item at specified index
GET 	/report/items/{index}/width - gets item width
UPDATE 	/report/items/{index}/width - updates item width
...
```

The following code will create client-side version of report view model:

```javascript
$.get('/report').then(function(response) {
  return ko.rest(response, {url: '/report'});
}).then(function(report) {
  // now report has observable properties
  // you could set report width
  report.width(100); // this sends 'UPDATE /report/width {value:100}' to update server view model
  // call fetch to get latest version of view model
  report.fetch(); // returns promise!
  // update width of second report item
  report.items()[1].width(50); // this sends 'UPDATE /report/items[1]/width {value:50}'
  // and obviously you could bind this view model to UI using ko.applyBindings() and so on...
});
```
