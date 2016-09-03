define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        'Rest',
        'getRequestStat',
        'catchOutcome',
        '$http',
        function($scope, $location, Rest, getRequestStat, catchOutcome, $http) {


            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            $scope.waitingrequests = waitingRequestResource.query();

            // group requests by user account

            $scope.users = {};

            $scope.waitingrequests.$promise.then(function() {

                for(var i=0; i<$scope.waitingrequests.length; i++) {
                    var uid = $scope.waitingrequests[i].user.id._id;
                    if (undefined === $scope.users[uid]) {
                        $scope.users[uid] = $scope.waitingrequests[i].user;
                        $scope.users[uid].requests = [];
                    }

                    delete $scope.waitingrequests[i].user;
                    $scope.users[uid].requests.push($scope.waitingrequests[i]);
                }


            });

            $scope.getStat = getRequestStat;


            /**
             * Save one request
             * @param {Object} request
             */
            function saveApprovalStatus(request) {
                 /*jshint validthis:true */
                var action = this;
                var approvalStep;

                request.approvalSteps.forEach(function(step) {
                    if ('waiting' === step.status && step.approvers.indexOf($scope.sessionUser._id)) {
                        approvalStep = step;
                    }
                });

                catchOutcome(
                    $http.put('/rest/manager/waitingrequests/'+request._id, {
                        approvalStep: approvalStep,
                        action: action
                    })
                );
            }


            $scope.accept = function() {
                $scope.waitingrequests.forEach(saveApprovalStatus.bind('wf_accept'));
            };

            $scope.reject = function() {
                $scope.waitingrequests.forEach(saveApprovalStatus.bind('wf_reject'));
            };

	}];
});
