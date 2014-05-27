define(['jquery'], function() {
	return ['$scope', '$http', 'authService', '$rootScope', function($scope, $http, authService, $rootScope) {
		
		$scope.submit = function() {
			
			$http.post('rest/login/forgot', { 
				email: $scope.email  
			})
			
			.success(function(data) {
				
				if (data.success)
				{
					console.log(data);
					
				} else {
					
					for(var i=0; i<data.errors.length; i++)
					{
						$rootScope.pageAlerts = [{ type: 'danger', text: data.errors[i]}];
					}
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
