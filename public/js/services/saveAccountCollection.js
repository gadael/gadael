define([], function() {
    
    /**
     * Save all account collections
     * 
     */
    return function($scope, $q, catchOutcome) {


        if (!$scope.user.roles || !$scope.user.roles.account) {
            // TODO remove the existing collections
            return;
        }

        var promises = [];


        for(var i=0; i<$scope.accountCollections.length; i++) {

            var document = $scope.accountCollections[i];
            if ($scope.user.roles && $scope.user.roles.account) {
                document.account = $scope.user.roles.account;
            } else {
                document.user = $scope.user._id;
            }

            var p;

            if (document._id) {
                p = document.$save();
            } else {
                p = document.$create();
            }

            promises.push(catchOutcome(p));
        }

        var promise = $q.all(promises);

        return promise;
    };
});