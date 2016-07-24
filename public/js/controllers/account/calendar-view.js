define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$anchorScroll',
        '$location',
        'Rest',
        'gettext',
        function($scope, $routeParams, Calendar, $anchorScroll, $location, Rest, gettext) {

            $scope.setPageTitle(gettext('Personal calendar'));



            var calendarEventsResource = Rest.user.calendarevents.getResource();
            var personalEventsResource = Rest.account.personalevents.getResource();
            var requestsResource = Rest.account.requests.getResource();


            Calendar.initLoadMoreData($scope, calendarEventsResource, personalEventsResource);

            $scope.loadPreviousYear = function() {
                $location.path('/account/calendar/'+$scope.previousYear+'/0');
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
