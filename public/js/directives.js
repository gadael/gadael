define(['angular', 'services'], function(angular) {
	'use strict';

	/**
	 *  Directives 
	 */

	angular.module('inga.directives', ['inga.services'])
	
	/**
	 * set the html lang attribute
	 */ 
	.directive('ingaLang', function() {
		return function(scope, elm) {
			
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

		
		return function(scope, elem) {

			//once Angular is started, remove class:
			//elem.removeClass('waiting-for-angular');
			
			var main = angular.element(elem);
			var login = angular.element(document.querySelector('.inga-auth-form'));
			
			var unregister = scope.$on('event:auth-loginRequired', function() {

				if (login.length === 0)
				{
					login = angular.element('<div><div class="inga-auth-form container" ng-include="\'partials/login.html\'"></div></div>');
					$compile(login.contents())(scope);
					login = angular.element(login[0]);
					login.css('display', 'none');
					main.parent().append(login);
				}

				login.css('display', 'block');
				main.css('display', 'none');
				
				unregister();
			});

			scope.$on('event:auth-loginConfirmed', function() {
				main.css('display', 'block');
				login.css('display', 'none');
			});
		};
	}]);
});
