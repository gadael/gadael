define([], function() {
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions',
		'loadWorkschedulesOptions',
		'loadNonWorkingDaysOptions', function(
			$scope, 
			$location, 
			IngaResource, 
			loadCollectionsOptions, 
			loadDepartmentsOptions, 
			loadWorkschedulesOptions, 
			loadNonWorkingDaysOptions
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();
		
		$scope.user.$promise.then(function() {
			
			$scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined);
			$scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined);
			$scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined);
			
		});
		
		
		loadCollectionsOptions($scope);
		loadDepartmentsOptions($scope);
		loadWorkschedulesOptions($scope);
		loadNonWorkingDaysOptions($scope);
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		}
		
		
		$scope.saveUser = function() {
			$scope.user.ingaSave($scope.cancel);
	    }
	    
	    $scope.datePicker = function($event) {
			$event.preventDefault();
			$event.stopPropagation();
			$scope.opened = true;
			
			console.log('test');
		}
	}];
});

