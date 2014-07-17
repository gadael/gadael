

define([
	'angular',
	'filters',
	'services',
	'directives',
	'gettext',
	'controllers',
	'angularRoute',
	'angularAuth',
	'paginateAnything',
	'passwordStrength'
	], 
	
	function (angular, filters, services, directives, controllers) {
	'use strict';

	// Declare app level module which depends on filters, and services
	
	var inga = angular.module('inga', [
		'ngRoute',
		'inga.controllers',
		'inga.filters',
		'inga.services',
		'inga.directives',
		'inga.gettext',
		'http-auth-interceptor',
		'begriffs.paginate-anything',
		'vr.directives.passwordStrength.width',
		'ui.bootstrap.dropdown'
	]);

	

	inga.run(['$rootScope', '$location', '$http', function($rootScope, $location, $http) {
		
		/**
		 * Update accessibles items and user informations
		 * on the main page
		 */  
		$rootScope.reloadSession = function() {
			$http.get('/rest/common').success(function(response) { 
				$rootScope.user = response.user;
				$rootScope.user.intAuthenticated = response.user.isAuthenticated ? 1 : 0;
			});
			
			// TODO: reload the ng-view content
		};
		
		// sync with serveur session on app start
		$rootScope.reloadSession();
		
		$rootScope.logout = function()
		{
			$http.get('/rest/logout').success(function(data) { 
				$rootScope.reloadSession(); 
				$location.path("/");
			});
		}
		
		$rootScope.$on('$routeChangeStart', function(next, current) { 
			// reset alert messages on page change
			$rootScope.pageAlerts = [];
		});

		$rootScope.$on('$viewContentLoaded', function() {

			// hide the login form and display the loaded page, 
			// usefull if the user exit from an autorization required page
			angular.element(document.querySelector('[inga-auth]')).css('display', 'block');
			angular.element(document.querySelector('.inga-auth-form')).css('display', 'none');

			// select active menu item according to the current path
			angular.element(document.querySelectorAll('.navbar-default li')).removeClass('active');
			angular.element(document.querySelector('.navbar-default a[href="#'+$location.path()+'"]')).parent().addClass('active');
		});
	}]);
		
	return inga;
});




