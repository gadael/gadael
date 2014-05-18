

define([
    	'angular',
    	'filters',
    	'services',
    	'directives',
    	'gettext',
    	'controllers',
    	'angularRoute'
    	
    	], function (angular, filters, services, directives, controllers) {
    		'use strict';

    		// Declare app level module which depends on filters, and services
    		
    		return angular.module('inga', [
    			'ngRoute',
    			'inga.controllers',
    			'inga.filters',
    			'inga.services',
    			'inga.directives',
    			'inga.gettext'
    		]);
    		
    		
    });

