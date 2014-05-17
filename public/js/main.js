require.config({
	paths: {
		angular: '../bower_components/angular/angular',
		angularRoute: '../bower_components/angular-route/angular-route',
		angularMocks: '../bower_components/angular-mocks/angular-mocks',
		requirejstext: '../bower_components/requirejs-text/text',
    	jquery: '../bower_components/jquery/dist/jquery.min',
    	bootstrap: '../bower_components/bootstrap/dist/js/bootstrap.min'
	},
	shim: {
		'angular' : {'exports' : 'angular'},
		'angularRoute': ['angular'],
		'angularMocks': {
			deps:['angular'],
			'exports':'angular.mock'
		},
		'jquery': {'exports' : 'jquery'},
		'bootstrap': ['jquery']
	},
	priority: ["angular"]
});





//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require( [
	'angular',
	'app',
	'routes'
	], 
	function(angular, app, routes) {
	
		'use strict';
		
		//var $html = angular.element(document.getElementsByTagName('html')[0]);
		
		angular.element().ready(function() {
			angular.resumeBootstrap([app['name']]);
		});
	});


require(['bootstrap'], function(bootstrap) {
	// bootstrap is loaded
});