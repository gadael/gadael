define(['angular', 'services'], function (angular) {
	'use strict';

	/* Controllers */
	
	return angular.module('inga.controllers', ['inga.services'])

		// Sample controller where service is being used
		.controller('MyCtrl1', ['$scope', 'version', function ($scope, version) {
			$scope.scopedAppVersion = version;
		}])
		
		// More involved example where controller is required from an external file
		.controller('MyCtrl2', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/myctrl2'], function(myctrl2) {
				// injector method takes an array of modules as the first argument
				// if you want your controller to be able to use components from
				// any of your other modules, make sure you include it together with 'ng'
				// Furthermore we need to pass on the $scope as it's unique to this controller
				$injector.invoke(myctrl2, this, {'$scope': $scope});
			});
		}])
	
		
		.controller('Home', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/home'], function(home) {
				$injector.invoke(home, this, {'$scope': $scope});
			});
		}])
	
		.controller('Login', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/index'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginForgot', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/forgot'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginReset', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/reset'], function(reset) {
				$injector.invoke(reset, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginTwitter', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/twitter'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginGithub', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/github'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginFacebook', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/facebook'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginGoogle', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/google'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('LoginTumblr', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/login/tumblr'], function(login) {
				$injector.invoke(login, this, {'$scope': $scope});
			});
		}])
		
		.controller('Admin', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/index'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminRequests', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/requests'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminUsers', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/users'], function(adminusers) {
				$injector.invoke(adminusers, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminDepartments', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/departments'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminCollections', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/collections'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminTypes', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/types'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('AdminRights', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/admin/rights'], function(admin) {
				$injector.invoke(admin, this, {'$scope': $scope});
			});
		}])
		
		.controller('Signup', ['$scope', '$injector', function($scope, $injector) {
			require(['controllers/signup'], function(signup) {
				$injector.invoke(signup, this, {'$scope': $scope});
			});
		}]);
});
