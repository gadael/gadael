define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$location',
        'Rest',
        'gettext',
        function($scope, $routeParams, Calendar, $location, Rest, gettext) {

            $scope.who = 'account';
            $scope.setPageTitle(gettext('Personal calendar'));

            var calendarEventsResource = Rest.user.calendarevents.getResource();
            var personalEventsResource = Rest.account.personalevents.getResource();
            var requestsResource = Rest.account.requests.getResource();

            Calendar.initNextPrevious($scope, calendarEventsResource, personalEventsResource, requestsResource);
	    }
    ];
});
