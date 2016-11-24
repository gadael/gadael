define(['angular'], function(angular) {

    'use strict';

	return ['$scope', '$http', 'authService', '$rootScope', '$location', 'gettext', 'catchOutcome',
    function($scope, $http, authService, $rootScope, $location, gettext, catchOutcome) {

        $scope.setPageTitle(gettext('Login'));




		$scope.submit = function() {

			catchOutcome($http.post('rest/login', {
				username: $scope.username,
				password: $scope.password
			}))
			.success(function(data) {

				$rootScope.pageAlerts = data.alert;


				if (data.$outcome.success)
				{
					// change the sign in button to the user parameters menu
					// update the main menu
					var promisedSession = $rootScope.reloadSession();
                    var displayAuthForm = angular.element(document.querySelector('[gadael-auth]')).css('display');

					if ('block' === displayAuthForm || '' === displayAuthForm)
					{
						// redirect
                        promisedSession.then(function() {
                            $location.path("/");
                        });

					} else {

						// re-send failed HTTP request on 401 status if authentication form displayed
						// because of the http-auth-interceptor
						authService.loginConfirmed();

						// hide the login form if displayed because of a 401 status on HTTP request
						angular.element(document.querySelector('[gadael-auth]')).css('display', 'block');
						angular.element(document.querySelector('.gadael-auth-form')).css('display', 'none');
					}
				}
			})

			.error(function(data) {
				// receive 400 bad request on missing parameters, login or password

				for (var fieldname in data.errfor)
				{
                    if (data.errfor.hasOwnProperty(fieldname)) {
                        angular.element(document.querySelector('input[name="'+fieldname+'"]')).closest('.form-group').addClass('has-error');
                    }
				}
			});
	    };
	}];
});
