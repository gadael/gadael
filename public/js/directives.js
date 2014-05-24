define(['angular', 'services'], function(angular, services) {
	'use strict';

  /* Directives */

	angular.module('inga.directives', ['inga.services'])
		.directive('ingaLang', function() {
			return function(scope, elm, attrs) {
				
				var lang = navigator.language || navigator.userLanguage;
				
				switch(lang)
				{
					case 'en':
					case 'fr':
					break;
					
					default: // unsuported language
						lang = 'fr';
				}
				
				elm.attr('lang', lang);
				elm.removeAttr('inga-lang');
		};
	});
});
