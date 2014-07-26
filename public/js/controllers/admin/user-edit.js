define([], function() {
	return ['$scope', '$location', 'IngaResource', 'loadCollectionsOptions', 'loadDepartmentsOptions', function($scope, $location, IngaResource, loadCollectionsOptions, loadDepartmentsOptions) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();
		
		$scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined);
		$scope.user.isAdmin 	= $scope.user.roles && $scope.user.roles.admin 		!== undefined;
		$scope.user.isManager 	= $scope.user.roles && $scope.user.roles.manager 	!== undefined;
		
		loadCollectionsOptions($scope);
		loadDepartmentsOptions($scope);
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		}
		
		
		$scope.saveUser = function() {
			console.log($scope.user.roles);
			$scope.user.ingaSave($scope.cancel);
	    }
	}];
});

