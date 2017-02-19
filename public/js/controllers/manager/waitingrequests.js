define([], function() {

    'use strict';

	return [
        '$scope',
        '$route',
        'Rest',
        'getRequestStat',
        'catchOutcome',
        '$http',
        '$q',
        function($scope, $route, Rest, getRequestStat, catchOutcome, $http, $q) {


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
             * @return {Promise}
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

                return catchOutcome(
                    $http.put('/rest/manager/waitingrequests/'+request._id, {
                        approvalStep: approvalStep,
                        action: action
                    })
                );
            }


            $scope.accept = function(requests) {
                $q.all(requests.map(saveApprovalStatus.bind('wf_accept')))
                .then($route.reload);
            };

            $scope.reject = function(requests) {
                $q.all(requests.map(saveApprovalStatus.bind('wf_reject')))
                .then($route.reload);
            };

	}];
});
