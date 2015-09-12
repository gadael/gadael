define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        'Rest',
        'getRequestStat',
        function($scope, $location, Rest, getRequestStat) {


            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            var waitingrequests = waitingRequestResource.query();

            // group requests by user account

            $scope.users = {};

            waitingrequests.$promise.then(function() {

                for(var i=0; i<waitingrequests.length; i++) {
                    var uid = waitingrequests[i].user.id._id;
                    if (undefined === $scope.users[uid]) {
                        $scope.users[uid] = waitingrequests[i].user;
                        $scope.users[uid].requests = [];
                    }

                    delete waitingrequests[i].user;
                    $scope.users[uid].requests.push(waitingrequests[i]);
                }


            });

            $scope.getStat = getRequestStat;

	}];
});
