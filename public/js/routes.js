define(['angular', 'app'], function(angular, app) {
	'use strict';

	return app.config(['$routeProvider', function($routeProvider) {
		
		$routeProvider.when('/view1', {
			templateUrl: 'partials/partial1.html',
			controller: 'MyCtrl1'
		});
		
		$routeProvider.when('/view2', {
			templateUrl: 'partials/partial2.html',
			controller: 'MyCtrl2'
		});
		
		$routeProvider.when('/home', {
			templateUrl: 'partials/home.html',
			controller: 'Home'
		});
		
		$routeProvider.when('/signup', {
			templateUrl: 'partials/signup.html',
			controller: 'Signup'
		});
		
		$routeProvider.when('/login', {
			templateUrl: 'partials/login.html',
			controller: 'Login'
		});
		
		$routeProvider.when('/login/forgot', {
			templateUrl: 'partials/login/forgot.html',
			controller: 'LoginForgot'
		});
		
		$routeProvider.when('/login/reset/:email/:token/', {
			templateUrl: 'partials/login/reset.html',
			controller: 'LoginReset'
		});
		
		$routeProvider.when('/login/twitter/callback/', {
			templateUrl: 'partials/login/twitter.html',
			controller: 'LoginTwitter'
		});
		
		$routeProvider.when('/login/github/callback/', {
			templateUrl: 'partials/login/github.html',
			controller: 'LoginGithub'
		});
		
		$routeProvider.when('/login/facebook/callback/', {
			templateUrl: 'partials/login/facebook.html',
			controller: 'LoginFacebook'
		});
		
		$routeProvider.when('/login/google/callback/', {
			templateUrl: 'partials/login/google.html',
			controller: 'LoginGoogle'
		});
		
		$routeProvider.when('/login/tumblr/callback/', {
			templateUrl: 'partials/login/tumblr.html',
			controller: 'LoginTumblr'
		});
		
		
		// authenticated pages
		
		$routeProvider.when('/admin', {
			templateUrl: 'partials/admin/home.html',
			controller: 'AdminHome'
		});
		
		$routeProvider.otherwise({redirectTo: '/home'});
	}]);

});
