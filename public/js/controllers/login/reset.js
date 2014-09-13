define(['angular'], function(angular) {
    
    'use strict';
    
	return ['$scope', '$http', '$rootScope', '$routeParams', function($scope, $http, $rootScope, $routeParams) {
		

		$scope.submit = function() {
			
			$http.post('rest/login/reset', { 
				password: $scope.password,
				confirm: $scope.confirm,
				email: $routeParams.email,
				token: $routeParams.token  
			})
			
			.success(function(data) {
			
				$rootScope.pageAlerts = data.alert;
				// if (data.success)
				// {
				// 	password reseted
				// }
			})
			
			.error(function(data) {
				// receive 400 bad request on missing parameters
				
				$rootScope.pageAlerts = data.alert;
				
				for (var fieldname in data.errfor)
				{
                    if (data.errfor.hasOwnProperty(fieldname)) {
                        angular.element('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
                    }
				}
			});
	    };
	}];
});
