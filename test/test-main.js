


var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/\/base\/test\/.*Spec\.js$/.test(file)) {
        tests.push(file);
    }
  }
}

requirejs.config({
    
    baseUrl: '/base/public/js',

    paths: {
        angular: 				'../bower_components/angular/angular.min',
		angularRoute: 			'../bower_components/angular-route/angular-route',
		angularMocks: 			'../bower_components/angular-mocks/angular-mocks',
		angularResource: 		'../bower_components/angular-resource/angular-resource.min',
    	angularstrap:			'../bower_components/angular-strap/dist/angular-strap.min',
    	angularstraptpl:		'../bower_components/angular-strap/dist/angular-strap.tpl.min',
    	angular_frfr:			'../bower_components/angular-i18n/angular-locale_fr-fr',	
    	angularGettext: 		'../bower_components/angular-gettext/dist/angular-gettext',
		angularAuth: 			'../bower_components/angular-http-auth/src/http-auth-interceptor',
		paginateAnything:		'../bower_components/angular-paginate-anything/src/paginate-anything',
		passwordStrength: 		'../bower_components/angular-password-strength/build/angular-password-strength.min',
		angularAnimate:			'../bower_components/angular-animate/angular-animate.min',
		angularSanitize:		'../bower_components/angular-sanitize/angular-sanitize.min'		 
    },

    shim: {
        'angular' : {'exports' : 'angular'},
		'routes': ['angular'],
		'angularMocks': {
			deps:['angular'],
			'exports':'angular.mock'
		},
        'app': ['angular', 'angularMocks'],
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

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
