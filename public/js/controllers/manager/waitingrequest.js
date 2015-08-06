define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        '$alert', function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            $alert
		) {


		$scope.request = Rest.manager.waitingrequests.getFromUrl().loadRouteId();

        $scope.request.$promise.then(function() {
            // find the approval step to approve

            $scope.request.approvalSteps.forEach(function(step) {
                if ('waiting' === step.status && step.approvers.indexOf($scope.user._id)) {
                    $scope.request.approvalStep = step;
                }
            });

            if (undefined === $scope.request.approvalStep) {
                $alert({
                    title: 'No waiting step to approve',
                    placement: 'top',
                    type: 'danger',
                    show: true
                });
            }
        });

        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/manager/waitingrequests');
        };


        $scope.accept = function() {
            $scope.request.action = 'wf_accept';
            $scope.request.ingaSave($scope.backToList);
        };

        $scope.reject = function() {
            $scope.request.action = 'wf_reject';
            $scope.request.ingaSave($scope.backToList);
        };


	}];
});

