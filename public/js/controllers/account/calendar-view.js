define(['angular'], function(angular) {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$anchorScroll',
        '$location',
        'Rest',
        '$scrollspy',
        'gettext',
        function($scope, $routeParams, Calendar, $anchorScroll, $location, Rest, $scrollspy, gettext) {

            $scope.setPageTitle(gettext('Personal calendar'));

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
            var requestsResource = Rest.account.requests.getResource();

            $scope.cal = Calendar.createCalendar(year, month, calendarEventsResource, personalEventsResource);
            $scope.previousYear = $scope.cal.nav.years[0].y - 1;

            $scope.loadPreviousYear = function() {
                $location.path('/account/calendar/'+$scope.previousYear+'/0');
            };

            $scope.scrollTo = function(id) {
                $anchorScroll(id);
            };


            $scope.isLoading = false;
            $scope.loadMoreData = function() {
                if (!$scope.isLoading) {
                    $scope.isLoading = true;
                    Calendar.addWeeks($scope.cal, 6, calendarEventsResource, personalEventsResource).then(function() {
                        $scope.isLoading = false;

                        // refresh scrollSpy
                        var scrollspy = $scrollspy(angular.element(document.getElementsByClassName('bs-sidenav')[0]), {});
                        scrollspy.init();

                    }, function(error) {
                        $scope.isLoading = false;
                        throw error;
                    });
                }
            };


            $scope.getRequest = function(request) {

                if (undefined === request || null === request) {
                    return null;
                }

                return requestsResource.get({ id: request._id });
            };
	    }
    ];
});
