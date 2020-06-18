define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        '$q',
        'catchOutcome',
        '$routeParams',
        function(
			$scope,
			$location,
			Rest,
            $q,
            catchOutcome,
            $routeParams
		) {

        var overtimeResource = Rest.admin.overtimes.getResource();
        var unavailableEventsResource = Rest.admin.unavailableevents.getResource();
		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        /**
         * Accumulator function for events duration
         * @param {Number} acc
         * @param {Object} event
         * @return {Number}
         */
        function sumHours(acc, event) {
            var startHour = (event.dtstart.getHours() + (event.dtstart.getMinutes() / 60));
            var endHour = (event.dtend.getHours() + (event.dtend.getMinutes() / 60));
            return acc + endHour - startHour;
        }

        /**
         * Create new empty overtime
         */
        function createOvertime() {
            var overtime = new overtimeResource();
            overtime.user = $routeParams.id;
            overtime.mode = 'period';
            return overtime;
        }

        function composeDate(day, time) {
            return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes());
        }

        $scope.overtimes = [createOvertime()];

        $scope.addOvertime = function() {
            $scope.overtimes.push(createOvertime());
        };

        $scope.setDuration = function(overtime) {
            if (overtime.day && overtime.to && overtime.from && overtime.from < overtime.to) {
                // get duration & events from server
                overtime.quantity = 0;
                overtime.events = [];
                var params = {
                    user: $routeParams.id,
                    dtstart: composeDate(overtime.day, overtime.from),
                    dtend: composeDate(overtime.day, overtime.to)
                };
                unavailableEventsResource.query(params).$promise
                .then(function(unavailableEvents) {
                    overtime.quantity = Math.round(10 * unavailableEvents.reduce(sumHours, 0)) / 10;
                    overtime.events = unavailableEvents;
                });
            } else {
                overtime.quantity = null;
                overtime.events = null;
            }
        };

        $scope.saveOvertimes = function() {
            $q.all(
                $scope.overtimes.filter(function(overtime) {
                    return overtime.quantity > 0;
                })
                .map(function(overtime) {
                    if (overtime.events === undefined) {
                        overtime.events = [];
                    }
                    return catchOutcome(overtime.$create());
                })
            )
            .then($scope.cancel);
        };

		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};
	}];
});
