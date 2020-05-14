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
        '$modal',
        function($scope, $route, Rest, getRequestStat, catchOutcome, $http, $q, $modal) {


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
            function save(comment, request) {
                 /*jshint validthis:true */
                var action = this;
                var approvalStep;

                request.approvalSteps.forEach(function(step) {
                    if ('waiting' === step.status && step.approvers.indexOf($scope.sessionUser._id)) {
                        approvalStep = step;
                    }
                });

                return catchOutcome(
                    $http.put('rest/manager/waitingrequests/'+request._id, {
                        approvalStep: approvalStep,
                        action: action,
                        comment: comment
                    })
                );
            }

            function addCommentThenSave(requests, action) {
                var modalscope = $scope.$new();
                modalscope.action = action;
                modalscope.comment = '';

                var modal = $modal({
                    scope: modalscope,
                    templateUrl: 'partials/manager/comment-approval-modal.html',
                    show: true
                });

                modalscope.cancel = function() {
                    modal.hide();
                };

                modalscope.save = function() {
                    $q.all(requests.map(save.bind(action, modalscope.comment)))
                    .then($route.reload);
                };
            }

            $scope.accept = function(requests) {
                addCommentThenSave(requests, 'wf_accept');
            };

            $scope.reject = function(requests) {
                addCommentThenSave(requests, 'wf_reject');
            };

	}];
});
