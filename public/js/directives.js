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
			elm.removeAttr('gadael-lang');
		};
	})

	/**
	 * This scope in page will be replaced by the partial/login/login.html if a http 401 is encountred
	 * 
	 */
	.directive('ingaAuth', ['$compile', function($compile) {

		
		return function(scope, elem) {

			//once Angular is started, remove class:
			//elem.removeClass('waiting-for-angular');
			
			var main = angular.element(elem);
			var login = angular.element(document.querySelector('.gadael-auth-form'));
			
			var unregister = scope.$on('event:auth-loginRequired', function() {

				if (login.length === 0)
				{
					login = angular.element('<div><div class="gadael-auth-form container" ng-include="\'partials/login/login.html\'"></div></div>');
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
	}])


    .directive('scroll', function() {

        function getScroll() {
            if(window.pageYOffset !== undefined){
                return {
                    height: window.innerHeight,
                    top: window.pageYOffset
                };
            }
            else{
                var sx, sy, d= document, r= d.documentElement, b= d.body;
                sx= r.scrollHeight || b.scrollHeight || 0;
                sy= r.scrollTop || b.scrollTop || 0;
                return {
                    height: sx,
                    top: sy
                };
            }
        }


        return function(scope, elm, attr) {
            angular.element(document).bind('scroll', function() {
                var scroll = getScroll();

                if (scroll.top +scroll.height > elm[0].offsetHeight) {
                    scope.$apply(attr.scroll);
                }
            });
        };
    })



    /**
     * For login/password fields, refresh data binding by timeout if necessary
     * because the auto-fill does not update the scope
     */
    .directive('autoFillSync', function($timeout) {
       return {
          require: 'ngModel',
          link: function(scope, elem, attrs, ngModel) {
              var origVal = elem.val();
              $timeout(function () {
                  var newVal = elem.val();
                  if(ngModel.$pristine && origVal !== newVal) {
                      ngModel.$setViewValue(newVal);
                  }
              }, 500);
          }
       };
    });
});
