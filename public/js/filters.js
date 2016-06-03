define(['angular', 'services'], function (angular) {
	'use strict';

	/* Filters */
  
	angular.module('gadael.filters', ['gadael.services'])
        .filter('nlToArray', function() {
            return function(text) {
                return text.split('\n');
            };
        })
    ;

});
