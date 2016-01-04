define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        function($scope, $routeParams, Calendar) {

            var year = parseInt($routeParams.year, 10);
            var month = parseInt($routeParams.month, 10);
            $scope.weeks = [];

            $scope.listyears = Calendar.getNavigation(year, month);
	    }
    ];
});
