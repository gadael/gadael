define([
    'angular', 
    'services/modules/loadableResource', 
    'services/modules/catchOutcome', 
    'angularResource'], 
    function (angular, loadableResource, catchOutcome) {
    
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
     * catch outcome messages from the rest service and 
     *  - forward messages to rootscope
     *  - highlight the missing fields
     */
    .factory('catchOutcome', ['$rootScope', '$q', function($rootScope, $q) {
        
        return catchOutcome(angular, $rootScope, $q);
    }])
    
    
    .factory('ResourceFactory', 
        ['$resource', function($resource) {
        
        /**
         * create a resource
         * @param   {string} collectionPath path to rest service
         * @param   {object} parameters Optional parameters default is { id:'@_id' }
         */
        var ResourceFactory = function(collectionPath, parameters) {
            
            if (undefined === parameters) {
                parameters = { id:'@_id' };   
            }
            
            return $resource(collectionPath, parameters, 
                { 
                    'save': { method:'PUT' },    // overwrite default save method (POST)
                    'create': { method:'POST' }
                }  
            );
        };
            
            
        return ResourceFactory;
        
    }])
    
    

	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */ 
	.factory('IngaResource', 
        ['ResourceFactory', '$routeParams', 'catchOutcome', 
        function(ResourceFactory, $routeParams, catchOutcome) {
            
        var buildResource = loadableResource(ResourceFactory, $routeParams, catchOutcome);
        
		/**
		 * Get the resource
		 * @param   {string} collectionPath [[Description]]
		 * @returns {Resource} the resource
		 */
		return function(collectionPath)
		{
			if ($routeParams.id) {
				return buildResource.real(collectionPath);
			}
			
			return buildResource.fake(collectionPath);
		};

	}])
	
    
    
    
        
    /**
	 * Add periods form in the array of items
     * 
	 */  
	.factory('addPeriodRow', function() {
        
      
        /**
         * Add periods form in the array of items (deferred service call)
         *
         * @param {Array}    items         items binded to rows
         * @param {$resource} itemResource resource for one row
         */
        return function($scope, items, itemResource) {

            require(['services/addPeriodRow'], function(serviceFn) {
                serviceFn(items, itemResource);
                $scope.$apply();
            });
        };
	})
    
 
	.factory('saveAccountCollection', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountCollection'], function(serviceFn) {
                serviceFn($scope, $q, catchOutcome).then(deferred.resolve);
            });
            
            return deferred.promise;
        };
	}])
    
    
    .factory('saveBeneficiaries', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account collections in scope
         * 
         * @param {Scope} $scope
         * @param {Integer} collectionId  The saved collection _id
         */
        return function($scope, collectionId) {
            var deferred = $q.defer();
            require(['services/saveBeneficiaries'], function(serviceFn) {
                serviceFn($scope, collectionId, $q, catchOutcome).then(deferred.resolve);
            });
            
            return deferred.promise;
        };
	}]);
	
	
});
