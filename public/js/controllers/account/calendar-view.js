define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$anchorScroll',
        '$location',
        function($scope, $routeParams, Calendar, $anchorScroll, $location) {

            var year, month, now = new Date();

            if (undefined !== $routeParams.year) {
                year = parseInt($routeParams.year, 10);
            } else {
                year = now.getFullYear();
            }

            if (undefined !== $routeParams.month) {
                month = parseInt($routeParams.month, 10);
            } else {
                month = now.getMonth();
            }

            $scope.cal = Calendar.createCalendar(year, month);

            $scope.scrollTo = function(id) {
                $location.hash(id);
                $anchorScroll();
            };
	    }
    ];
});
