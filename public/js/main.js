

require.config({
	paths: {
		angular: 				'../bower_components/angular/angular',
		angularRoute: 			'../bower_components/angular-route/angular-route',
		angularMocks: 			'../bower_components/angular-mocks/angular-mocks',
		angularResource: 		'../bower_components/angular-resource/angular-resource.min',
    	angularstrap:			'../bower_components/angular-strap/dist/angular-strap',
    	angularstraptpl:		'../bower_components/angular-strap/dist/angular-strap.tpl',
		en:						'../bower_components/angular-i18n/angular-locale_en-us',
    	fr:						'../bower_components/angular-i18n/angular-locale_fr-fr',
		es:						'../bower_components/angular-i18n/angular-locale_es-es',
    	angularGettext: 		'../bower_components/angular-gettext/dist/angular-gettext',
		angularAuth: 			'../bower_components/angular-http-auth/src/http-auth-interceptor',
		paginateAnything:		'../bower_components/angular-paginate-anything/dist/paginate-anything',
		passwordStrength: 		'../bower_components/angular-password-strength/build/angular-password-strength.min',
		angularAnimate:			'../bower_components/angular-animate/angular-animate.min',
		angularSanitize:		'../bower_components/angular-sanitize/angular-sanitize.min',
        moment:                 '../bower_components/moment/min/moment-with-locales.min',
        momentDurationFormat:   '../bower_components/moment-duration-format/lib/moment-duration-format',
        q:                      '../bower_components/q/q',
        async:                  '../bower_components/async/dist/async.min',
        d3:                     '../bower_components/d3/d3.min',
        nvd3:                   '../bower_components/nvd3/nv.d3.min',
        angularnvd3:            '../bower_components/angularjs-nvd3-directives/dist/angularjs-nvd3-directives.min',
        teleperiod:             '../bower_components/teleperiod/dist/teleperiod.min',
        angularTeleperiod:      '../bower_components/angular-teleperiod/src/angular-teleperiod',
        angularColorpicker:     '../bower_components/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min',
        angularImageCrop:       '../bower_components/angular-image-crop/image-crop',
        ngSortable:             '../bower_components/ng-sortable/dist/ng-sortable'
	},
	shim: {
		'angular' : {'exports' : 'angular'},
		'app': ['angular', 'angularSanitize'],
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
		'angularAnimate': ['angular'],
		'angularSanitize': ['angular'],
        'q': { 'exports': 'Q' },
        'teleperiod': ['q', 'd3'],
     //     'teleperiod': ['q', 'd3', 'tp_mousedrag', 'tp_selection', 'tp_timeline', 'tp_timespanboundary'],
        'angularTeleperiod': ['q', 'angular', 'teleperiod'],
        'angularImageCrop': ['angular'],
        'angularnvd3': ['angular', 'd3', 'nvd3'],
        'ngSortable': ['angular'],
		'fr': ['angular'],
		'en': ['angular'],
		'es': ['angular']
	},
	priority: ["angular"]
});





//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";





require( [
    'angular',
	'app',
	'common',
    'q',
	'routes',
	'angularstraptpl',
    'angularTeleperiod'
	],
	function(angular, app, common, Q) {

		'use strict';

        // hack for Q because shim export for q does not work
        window.Q = Q;

		common.then(function(common) {
			require([common.lang], function() {
				angular.element().ready(function() {
					angular.resumeBootstrap([app.name]);
				});
			});
		});
	});
