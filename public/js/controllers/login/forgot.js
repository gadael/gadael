define(['angular'], function(angular) {

    'use strict';

	return ['$scope', '$http', 'authService', '$rootScope', function($scope, $http, authService, $rootScope) {

		$scope.submit = function() {

			$http.post('rest/login/forgot', {
				email: $scope.email
			})

			.success(function(data) {
				$rootScope.pageAlerts = data.$outcome.alert;

			})

			.error(function(data) {
				// receive 400 bad request on missing parameters

				for (var fieldname in data.$outcome.errfor)
				{
                    if (data.errfor.hasOwnProperty(fieldname)) {
                        angular.element('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
                    }
				}
			});
	    };
	}];
});
