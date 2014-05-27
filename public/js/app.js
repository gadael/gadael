

define([
    	'angular',
    	'filters',
    	'services',
    	'directives',
    	'gettext',
    	'controllers',
    	'angularRoute',
    	'angularAuth'
    	
    	], function (angular, filters, services, directives, controllers) {
    		'use strict';

    		// Declare app level module which depends on filters, and services
    		
    		var inga = angular.module('inga', [
    			'ngRoute',
    			'inga.controllers',
    			'inga.filters',
    			'inga.services',
    			'inga.directives',
    			'inga.gettext',
    			'http-auth-interceptor'
    		]);

		

		inga.run(function($rootScope, $location) {

		   	$rootScope.$on('$viewContentLoaded', function() {
			    	require(['jquery'], function() {

					// hide the login form and display the loaded page, 
					// usefull if the user exit from an autorization required page
					jQuery('body>.container').show();
					jQuery('.inga-auth-form').slideUp();

					// select active menu item according to the current path
					jQuery('.navbar-default').find('a').closest('li').removeClass('active');
					jQuery('.navbar-default').find('a[href="#'+$location.path()+'"]').closest('li').addClass('active');
				});
			});
		});
    		
    	return inga;
    });




