define(['angular',  'angularResource'], function (angular) {
	'use strict';
	
	/* Services */
	
	angular.module('inga.services', ['ngResource'])
	
	
		
	/**
	 * Populate a select box with collections
	 */  
	.factory('loadCollectionsOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/collections')
            .then(function(result) {
                scope.collections = result.data;
			});
		};
	}])
	
	/**
	 * Populate a select box with departments
	 */  
	.factory('loadDepartmentsOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/departments')
            .then(function(result) {
                scope.departments = result.data;
			});
		};
	}])
	
	
	/**
	 * Populate a select box with workschedule calendars
	 */  
	.factory('loadWorkschedulesOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/calendars?type=workschedule')
            .then(function(result) {
                scope.workschedules = result.data;
			});
		};
	}])
	
	
	/**
	 * Populate a select box with nonworkingday calendars
	 */  
	.factory('loadNonWorkingDaysOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/calendars?type=nonworkingday')
            .then(function(result) {
                scope.nonworkingdays = result.data;
			});
		};
	}])
	
    
    /**
	 * Populate a select box with right types
	 */  
	.factory('loadTypesOptions', ['$http', function($http) {
		
		return function(scope) {
			$http.get('/rest/admin/types')
            .then(function(result) {
                scope.types = result.data;
            });
		};
	}])
    
    


	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */ 
	.factory('IngaResource', ['$resource', '$routeParams', '$rootScope', function($resource, $routeParams, $rootScope){
		
		
		return function(collectionPath)
		{
			var ingaSave = function(nextaction) {
				
				var p = this.$save()
				.catch()
				.then(function(data) {

					$rootScope.pageAlerts = data.alert;
					
					if (nextaction && data.success) {
						nextaction();
					}
				},
				function(badRequest) {
					
					var data = badRequest.data;
					
					$rootScope.pageAlerts = data.alert;

					// receive 400 bad request on missing parameters
					// mark required fields
					
					for(var fname in data.errfor) {
						if ('required' === data.errfor[fname]) {
							angular.element(document.querySelector('[ng-model$='+fname+']')).parent().addClass('has-error');
						}
					}
				});
			};
			
			
			if ($routeParams['id'])
			{
				var item = $resource(collectionPath+'/:id', $routeParams, {
					'save': { method:'PUT' }  // overwrite default save method (POST)
				});
				
				item.loadRouteId = function() {
					return this.get(function(data) {
						data.ingaSave = ingaSave;
					});
				};
				
				return item;
			}
			
			var collection = $resource(collectionPath);
			
			collection.loadRouteId = function() {
				// scope will be loaded with an empty instance
				
				var inst = new collection;
				inst.ingaSave = ingaSave;

				return inst;
			};
			
			return collection;
		};

	}])


	
	;
	
	
	
});
