define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        '$alert',
        '$http',
        'catchOutcome', function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            $alert,
            $http,
            catchOutcome
		) {


		$scope.request = Rest.manager.waitingrequests.getFromUrl().loadRouteId();

        /**
         * The approval step to edit
         * @var {Object}
         */
        var approvalStep;

        $scope.request.$promise.then(function() {
            // find the approval step to approve

            $scope.request.approvalSteps.forEach(function(step) {
                if ('waiting' === step.status && step.approvers.indexOf($scope.user._id)) {
                    approvalStep = step;
                }
            });

            if (undefined === approvalStep) {
                $alert({
                    title: 'No waiting step to approve',
                    type: 'danger',
                    show: true
                });
            }
        });

        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/manager/waitingrequests');
        };


        function save(action) {
            catchOutcome(
                $http.put('/rest/manager/waitingrequests/'+$scope.request._id, {
                    approvalStep: approvalStep,
                    action: action
                })
            ).then($scope.backToList);
        }

        $scope.accept = function() {
            save('wf_accept');
        };

        $scope.reject = function() {
            save('wf_reject');
        };


	}];
});

