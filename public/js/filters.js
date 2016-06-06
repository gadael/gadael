define(['angular', 'services'], function (angular) {
	'use strict';

	/* Filters */
  
	angular.module('gadael.filters', ['gadael.services'])
        .filter('nlToArray', function() {
            return function(text) {
                if (undefined === text) {
                    return [];
                }
                return text.split('\n');
            };
        })
    ;

});
