

define([
	'angular',
    'jsondates',
	'common',
	'filters',
	'services',
	'directives',
	'gettext',
	'controllers',
	'angularRoute',
	'angularAuth',
	'paginateAnything',
	'passwordStrength',
    'angularColorpicker',
    'angularImageCrop',
    'angularnvd3',
    'ngSortable'
	],

	function (angular, jsondates, common) {
	'use strict';

	// Declare app level module which depends on filters, and services

	var gadael = angular.module('gadael', [
		'ngRoute',
		'gadael.controllers',
		'gadael.filters',
		'gadael.services',
		'gadael.directives',
		'gadael.gettext',
		'http-auth-interceptor',
		'bgf.paginateAnything',
		'vr.directives.passwordStrength.width',
        'vr.directives.passwordStrength.class',
	//	'ngAnimate',
		'ngSanitize',
		'mgcrea.ngStrap',
        'tpTeleperiod',
        'colorpicker.module',
        'ImageCropper',
        'nvd3ChartDirectives',
        'as.sortable'
	]);



    gadael.config(function($dropdownProvider) {
        angular.extend($dropdownProvider.defaults, {
            animation: 'am-flip-x',
            html: true
        });
    });

    gadael.config(["$httpProvider", jsondates]);


	gadael.run(['$rootScope', '$location', '$http', '$q', 'gettext', 'gettextCatalog',
                function($rootScope, $location, $http, $q, gettext, gettextCatalog) {

        $rootScope.baseUrl = document.location.href.split('#')[0];

        $rootScope.setPageTitle = function(title) {
            $rootScope.pageTitle = gettextCatalog.getString('Gadael - %s').replace(/%s/, gettextCatalog.getString(title));
        };

		/**
		 * Update accessibles items and user informations
		 * on the main page
         *
         * @return {Promise}
		 */
		$rootScope.reloadSession = function() {

            var deferred = $q.defer();

			common.then(function(response) {

				if (response.errors) {

					if (undefined === $rootScope.pageAlerts) {
						$rootScope.pageAlerts = [];
					}

					for (var i=0; i<response.errors.length; i++) {
						$rootScope.pageAlerts.push({
		                    message: response.errors[i],
		                    type: 'danger'
		                });
					}

					delete response.errors;
				}

				for (var prop in response) {
                    if (response.hasOwnProperty(prop)) {
                        $rootScope[prop] = response[prop];
                    }
				}
				gettextCatalog.setCurrentLanguage(response.lang);

				$rootScope.sessionUser.intAuthenticated = response.sessionUser.isAuthenticated ? 1 : 0;

                deferred.resolve(true);
			}).catch(deferred.reject);

			return deferred.promise;
		};

		// sync with serveur session on app start
		$rootScope.reloadSession();

		$rootScope.logout = function()
		{
			$http.get('rest/logout').success(function() {
				$rootScope.reloadSession().then(function() {
                    document.location.href = './';
                });

			});
		};

		$rootScope.closeAlert = function(index) {
			$rootScope.pageAlerts.splice(index, 1);
		};


		$rootScope.$on('$routeChangeStart', function() {

            /**
             * Default page title
             */
            $rootScope.setPageTitle(gettext('Leaves managment'));

			// reset alert messages on page change

			setTimeout(function() {

				// the message stay on page because the bind is broken
				// it will not be displayed on the next page change

				$rootScope.pageAlerts = [];
			}, 2000);

		});


		$rootScope.$on('$viewContentLoaded', function() {

			// hide the login form and display the loaded page,
			// usefull if the user exit from an autorization required page
			angular.element(document.querySelector('[gadael-auth]')).css('display', 'block');
			angular.element(document.querySelector('.gadael-auth-form')).css('display', 'none');

			// select active menu item according to the current path
			angular.element(document.querySelectorAll('.navbar-default li')).removeClass('active');
			angular.element(document.querySelector('.navbar-default a[href="#'+$location.path()+'"]')).parent().addClass('active');
		});
	}]);

	return gadael;
});
