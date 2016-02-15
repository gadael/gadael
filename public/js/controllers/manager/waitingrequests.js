define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        'Rest',
        'getRequestStat',
        function($scope, $location, Rest, getRequestStat) {


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

	}];
});
