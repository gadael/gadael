define(['angular', 'services'], function(angular, services) {
	'use strict';

  /* Directives */

	angular.module('inga.directives', ['inga.services'])
		.directive('ingaLang', function() {
			return function(scope, elm, attrs) {
				elm.attr('lang', 'fr');
				elm.removeAttr('inga-lang');
		};
	});
});
