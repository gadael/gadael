define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

        var userResource = Rest.admin.users.getResource();

		$scope.beneficiary = Rest.admin.beneficiaries.getFromUrl().loadRouteId();



        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }

        $scope.user = userResource.get({id: $location.search().user});


		$scope.back = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};


	}];
});
