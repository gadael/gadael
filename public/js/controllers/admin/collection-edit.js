define(['jquery'], function() {
	return ['$scope', '$http', '$rootScope', '$routeParams', function($scope, $http, $rootScope, $routeParams) {

		// if there is a given ID, load the form
		
		
		if ($routeParams['id']) {
			
			$http.get('rest/admin/collections/'+$routeParams['id'])
			.success(function(data) {
			
				$scope.collection = data;
			})
		}
		
		
		$scope.cancel = function() {
			history.back();
		}
		
		
		$scope.saveCollection = function() {
			
			$http.post('rest/admin/collections/save', $scope.collection)
			
			.success(function(data) {
			
				$rootScope.pageAlerts = data.alert;
				if (data.success)
				{
					// saved
				}
			})
			
			.error(function(data) {
				// receive 400 bad request on missing parameters
				
				$rootScope.pageAlerts = data.alert;
				
				for (var fieldname in data.errfor)
				{
					jQuery('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
				}
			});
	    }
	}];
});

