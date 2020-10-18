define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        '$alert',
        '$http',
        'catchOutcome',
        '$modal',
        function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            $alert,
            $http,
            catchOutcome,
            $modal
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
                if ('waiting' === step.status && step.approvers.indexOf($scope.sessionUser._id)) {
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


        function save(action, comment) {
            return catchOutcome(
                $http.put('rest/manager/waitingrequests/'+$scope.request._id, {
                    approvalStep: approvalStep,
                    action: action,
                    comment: comment
                })
            );
        }

        function addCommentThenSave(action) {
            var modalscope = $scope.$new();
            modalscope.log = {};

            var modal = $modal({
                scope: modalscope,
                templateUrl: 'partials/manager/comment-approval-modal.html',
                show: true
            });

            modalscope.cancel = function() {
                modal.hide();
            };

            modalscope.save = function() {
                save(action, modalscope.log.comment).then(function() {
                    modal.hide();
                    $scope.backToList();
                });
            };
        }

        $scope.accept = function() {
            addCommentThenSave('wf_accept');
        };

        $scope.reject = function() {
            addCommentThenSave('wf_reject');
        };


	}];
});
