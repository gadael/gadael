define(['angular'], function(angular) {

    'use strict';

	return ['$scope', '$http', 'authService', '$rootScope', '$location', 'gettext', 'catchOutcome',
    function($scope, $http, authService, $rootScope, $location, gettext, catchOutcome) {

        $scope.setPageTitle(gettext('Login'));




		$scope.submit = function() {

			catchOutcome($http.post('rest/anonymous/formlogin', {
				username: $scope.username,
				password: $scope.password
			}))
			.then(function(data) {

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
                            document.location.href = './';
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
			});
	    };
	}];
});
