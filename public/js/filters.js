define(['angular', 'services'], function (angular) {
	'use strict';

	/* Filters */
  
	angular.module('inga.filters', ['inga.services'])
		.filter('interpolate', ['version', function(version) {
			return function(text) {
				return String(text).replace(/\%VERSION\%/mg, version);
			};
	}]);
});
