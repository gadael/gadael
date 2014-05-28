define(['jquery'], function() {
	return ['$scope', '$http', 'authService', '$rootScope', function($scope, $http, authService, $rootScope) {
		
		$scope.submit = function() {
			
			$http.post('rest/login/forgot', { 
				email: $scope.email  
			})
			
			.success(function(data) {
				
				$rootScope.pageAlerts = data.alert;
				
				if (data.success)
				{
					// OK
				}
			})
			
			.error(function(data) {
				// receive 400 bad request on missing parameters
				
				for (var fieldname in data.errfor)
				{
					jQuery('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
				}
			});
	    }
	}];
});
