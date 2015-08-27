define([], function() {

    'use strict';

	return ['$scope', '$location', '$routeParams', 'Rest', function($scope, $location, $routeParams, Rest) {

        var userResource = Rest.admin.users.getResource();
        var beneficiaryResource = Rest.admin.beneficiaries.getResource();





        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }

        $scope.user = userResource.get({id: $location.search().user});
        $scope.user.$promise.then(function() {
            $scope.beneficiary = beneficiaryResource.get({
                id: $routeParams.id,
                account: $scope.user.roles.account._id
            });
        });

		$scope.back = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};


	}];
});
