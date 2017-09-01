/**
 * initialize the translation file with requirejs
 * the gadael.gettext module will be set a dependency for angular in the main module declaration
 *
 * @see http://lostechies.com/gabrielschenker/2014/02/11/angularjspart-12-multi-language-support/
 */

define(['angular', 'angularGettext', 'translation'], function (angular) {
	'use strict';

	var app = angular.module('gadael.gettext', ['gettext']);

	//var lang = angular.element('html').attr('lang');
	var lang = navigator.language || navigator.userLanguage;

	switch(lang)
	{
		case 'en':
		case 'fr':
		case 'es':
		break;

		default: // unsuported language
			lang = 'fr';
	}



	app.run(function(gettextCatalog) {
		gettextCatalog.currentLanguage = lang;
		gettextCatalog.debug = false;

	});

	return app;
});
