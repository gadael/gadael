require.config({
	paths: {
		angular: 				'../bower_components/angular/angular',
		angularRoute: 			'../bower_components/angular-route/angular-route',
		angularMocks: 			'../bower_components/angular-mocks/angular-mocks',
		angularResource: 		'../bower_components/angular-resource/angular-resource.min',
    	angularstrap:			'../bower_components/angular-strap/dist/angular-strap',
    	angularstraptpl:		'../bower_components/angular-strap/dist/angular-strap.tpl',
    	angular_frfr:			'../bower_components/angular-i18n/angular-locale_fr-fr',	
    	angularGettext: 		'../bower_components/angular-gettext/dist/angular-gettext',
		angularAuth: 			'../bower_components/angular-http-auth/src/http-auth-interceptor',
		paginateAnything:		'../bower_components/angular-paginate-anything/src/paginate-anything',
		passwordStrength: 		'../bower_components/angular-password-strength/build/angular-password-strength.min',
		angularAnimate:			'../bower_components/angular-animate/angular-animate.min',
		angularSanitize:		'../bower_components/angular-sanitize/angular-sanitize.min',
        
	},
	shim: {
		'angular' : {'exports' : 'angular'},
		'app': ['angular'],
		'routes': ['angular'],
		'angularMocks': {
			deps:['angular'],
			'exports':'angular.mock'
		},
		'angularResource': ['angular'],
		'angularAuth':['angular'],
		'angularstrap': ['angular'],
		'angularstraptpl': ['angular', 'angularstrap'],
		'angularGettext' : ['angular'],
		'translation': ['angularGettext'],
		'paginateAnything': ['angular'],
		'passwordStrength': ['angular'],
		'angular_frfr': ['angular'],
		'angularAnimate': ['angular'],
		'angularSanitize': ['angular']
	},
	priority: ["angular"]
});





//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require( [
    'angular',
	'app',
	'routes',
	'angularstraptpl',
	'angular_frfr',
	'angularAnimate',
	'angularSanitize'
	], 
	function(angular, app) {
	
		'use strict';
		angular.element().ready(function() {
			angular.resumeBootstrap([app.name]);
		});	
	});


