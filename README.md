[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Build Status](https://drone.io/github.com/sergeyt/korest/status.png)](https://drone.io/github.com/sergeyt/korest/latest)
                                                                                 
[![Deps Status](https://david-dm.org/sergeyt/korest.png)](https://david-dm.org/sergeyt/korest)
[![DevDeps Status](https://david-dm.org/sergeyt/korest/dev-status.png)](https://david-dm.org/sergeyt/korest#info=devDependencies)
[![Dependency Status](https://gemnasium.com/sergeyt/korest.svg)](https://gemnasium.com/sergeyt/korest)

# korest

Function for [knockout.js](http://knockoutjs.com/) to map plain object into knockout observable with bound REST actions.
Similar to [knockout.mapping](https://github.com/SteveSanderson/knockout.mapping), but it is more simple and lightweight.

## API

`ko.rest(obj, options)` - wraps given plain JS object into object with knockout observable fields bound to REST actions. `options`:
* `url` - specifies root url to REST resource.

Wrapper has the following methods.

* `unwrap():Object` - unwraps to plain JS object.
* `update(obj):void` - updates observable fields with values from given plain JS object.
* `fetch():promise` - fetches latest version of object from server.

[![NPM version](https://badge.fury.io/js/korest.png)](http://badge.fury.io/js/)
[![Bower version](https://badge.fury.io/bo/korest.svg)](http://badge.fury.io/bo/korest)

[![NPM](https://nodei.co/npm/korest.png?downloads=true&stars=true)](https://nodei.co/npm/korest/)
