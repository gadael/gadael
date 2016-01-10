define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$anchorScroll',
        '$location',
        'Rest',
        function($scope, $routeParams, Calendar, $anchorScroll, $location, Rest) {

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

            var calendarEventsResource = Rest.user.calendarevents.getResource();
            var personalEventsResource = Rest.account.personalevents.getResource();

            $scope.cal = Calendar.createCalendar(year, month);

            $scope.scrollTo = function(id) {
                $anchorScroll(id);
            };


            $scope.isLoading = false;
            $scope.loadMoreData = function() {
                if (!$scope.isLoading) {
                    $scope.isLoading = true;
                    Calendar.addWeeks($scope.cal, 6, calendarEventsResource, personalEventsResource).then(function() {
                        $scope.isLoading = false;
                    }, function(error) {
                        $scope.isLoading = false;
                        throw error;
                    });
                }
            };
	    }
    ];
});
