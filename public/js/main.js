require.config({
	paths: {
		angular: 				'../bower_components/angular/angular.min',
		angularRoute: 			'../bower_components/angular-route/angular-route',
		angularMocks: 			'../bower_components/angular-mocks/angular-mocks',
		angularResource: 		'../bower_components/angular-resource/angular-resource.min',
		requirejstext: 			'../bower_components/requirejs-text/text',
    //	jquery: 				'../bower_components/jquery/dist/jquery.min',
    //	bootstrap: 				'../bower_components/bootstrap/dist/js/bootstrap.min',
    	bootstrap:				'../bower_components/angular-bootstrap/ui-bootstrap-tpls.min',
    	angularGettext: 		'../bower_components/angular-gettext/dist/angular-gettext',
		angularAuth: 			'../bower_components/angular-http-auth/src/http-auth-interceptor',
		paginateAnything:		'../bower_components/angular-paginate-anything/src/paginate-anything',
		passwordStrength: 		'../bower_components/angular-password-strength/build/angular-password-strength.min'
	},
	shim: {
		'angular' : {'exports' : 'angular'},
		'angularRoute': ['angular'],
		'angularMocks': {
			deps:['angular'],
			'exports':'angular.mock'
		},
		'angularResource': ['angular'],
		'angularAuth':['angular'],
	//	'jquery': {'exports' : 'jquery'},
		'bootstrap': ['angular'],
	//	'angularBootstrap': ['angular', 'bootstrap'],
		'angularGettext' : ['angular'],
		'translation': ['angularGettext'],
		'paginateAnything': ['angular'],
		'passwordStrength': ['angular']
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
		angular.element().ready(function() {
			angular.resumeBootstrap([app['name']]);
		});	
	});


require(['bootstrap'], function(bootstrap) {
	// bootstrap is loaded
});



