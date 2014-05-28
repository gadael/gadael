define(['angular', 'services'], function(angular, services) {
	'use strict';

	/**
	 *  Directives 
	 */

	angular.module('inga.directives', ['inga.services'])
	
	/**
	 * set the html lang attribute
	 */ 
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
	})

	/**
	 * This scope in page will be replaced by the partial/login.html if a http 401 is encountred 
	 * 
	 */
	.directive('ingaAuth', ['$compile', function($compile) {

		
		return function(scope, elem, attrs) {

			//once Angular is started, remove class:
			//elem.removeClass('waiting-for-angular');
			
			var main = jQuery(elem);
			
			scope.$on('event:auth-loginRequired', function() {
				
				var login = jQuery('.inga-auth-form');
				if (login.length == 0)
				{
					login = angular.element('<div><div class="inga-auth-form container" ng-include="\'partials/login.html\'"></div></div>');
					$compile(login.contents())(scope);
					login = jQuery(login[0]);
					login.hide();
					main.parent().append(login);
				}

				login.show();
				main.hide();
				
			});

			scope.$on('event:auth-loginConfirmed', function() {
				main.show();
				jQuery('.inga-auth-form').hide();
			});
		}
	}]);
});
