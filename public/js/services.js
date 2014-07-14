define(['angular', 'jquery', 'angularResource'], function (angular) {
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
					scope.collections.unshift({ name: '', _id:'' });
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
					scope.departments.unshift({ name: '', _id:'' });
			});
		};
	}])
	
	
	/**
	 * Save item to rest path (ex: edit form)
	 * Use a post http request if _id does not exists on item, for creation
	 * Use a put http request if _id exists on the item, for modification
	  
	.factory('saveItem', ['$http', '$rootScope', function($http, $rootScope) {
		
		return function(path, item) {
			
			if (item._id)
			{
				path += '/'+item._id;
				delete item._id;
				var httpQuery = $http.put(path, item);
				
			} else {
				var httpQuery = $http.post(path, item);
			}

			httpQuery.success(function(data) {
			
				$rootScope.pageAlerts = data.alert;
				if (data.success)
				{
					// saved
				}
			})
			
			.error(function(data) {
				// receive 400 bad request on missing parameters
				
				$rootScope.pageAlerts = data.alert;
				
				for (var fieldname in data.errfor)
				{
					jQuery('input[name="'+fieldname+'"]').closest('.form-group').addClass('has-error');
				}
			});
		};
	}])
	*/
	
	/**
	 * Load Json from rest path (ex: edit form)
	 * forward the path parameters in the current angular url
	 * to the path parameter of the rest service
	 * the two routes must use the same path parameter
	 * if a parmeter has not been found, the service do nothing (ex: object creation url)
	  
	.factory('loadItem', ['$http', '$routeParams', '$rootScope', function($http, $routeParams, $rootScope) {
		
		return function(path, callback) {
			
			var newpath = path.replace(/:(\w+)/g, function(match, p1) {
				if ($routeParams[p1])
				{
					return $routeParams[p1];
				} else {
					return match;
				}
			});
			
			if (newpath != path)
			{
				$http.get(newpath)
				.success(callback)
				.error(function(data) {
					// receive 400 bad request on missing parameters
					$rootScope.pageAlerts = data.alert;
				});
			}
		};
	}])
	*/


	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */ 
	.factory('IngaResource', ['$resource', '$routeParams', '$rootScope', function($resource, $routeParams, $rootScope){
		
		
		return function(collectionPath)
		{
			var ingaSave = function() {
				this.$save(function(data) {
					// receive 400 bad request on missing parameters
					$rootScope.pageAlerts = data.alert;
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
