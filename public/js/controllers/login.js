define(['jquery'], function() {
	return ['$scope', '$http', 'authService', '$rootScope', function($scope, $http, authService, $rootScope) {
		
		$scope.submit = function() {
			
			$http.post('rest/login', { 
				username: $scope.username, 
				password: $scope.password 
			})
			
			.success(function(data) {
				
				if (data.success)
				{
					// hide the login form if displayed because of a 401 status on HTTP request
					authService.loginConfirmed();
				} else {
					
					for(var i=0; i<data.errors.length; i++)
					{
						$rootScope.pageAlerts = [{ type: 'danger', text: data.errors[i]}];
					}
				}
			})
			
			.error(function(data) {
				// receive 400 bad request on missing parameters, login or password
				
				for (var fieldname in data.errfor)
				{
					jQuery('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
				}
			});
	    }
	}];
});
