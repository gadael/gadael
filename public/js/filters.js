define(['angular', 'services'], function (angular) {
	'use strict';

	/* Filters */
  
	angular.module('gadael.filters', ['gadael.services'])
		.filter('interpolate', ['version', function(version) {
			return function(text) {
				return String(text).replace(/\%VERSION\%/mg, version);
			};
	}]);
});
