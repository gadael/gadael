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

		.filter('rightQuantity', function($filter) {
		    var numberFilter = $filter('number');
		    return function(quantity) {

				if (undefined === quantity) {
					// special rights with variable quantity
					return '(?)';
				}

				if (null === quantity) {
					// right with infinite quantity
					return '∞';
				}

		    	return numberFilter(quantity);
		    };
		})

		.filter('reverse', function() {
			return function(items) {
				if (!items) {
					return items;
				}
				return items.slice().reverse();
			};
		})
    ;

});
