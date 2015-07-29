define([
    'angular', 
    'services/loadableResource', 
    'services/catchOutcome', 
    'services/rest',
    'services/absence-edit',
    'services/absence-stat',
    'angularResource'], 
    function (angular, loadableResource, catchOutcome, rest, AbsenceEdit, AbsenceStat) {
    
	'use strict';
    
	
	/* Services */
	
	angular.module('inga.services', ['ngResource'])
	
    
    
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
     * Load the collection of REST services
     */
    .factory('Rest', ['ResourceFactory', 'IngaResource', 
        function(ResourceFactory, IngaResource) {
            return rest(ResourceFactory, IngaResource);
        }
    ])
    
    
    /**
     * 
     */
    .factory('AbsenceStat',
        function() {
            return AbsenceStat;
        }
    )


    /**
     *
     */
    .factory('AbsenceEdit',  
        function() {
            return AbsenceEdit;
        }
    )
    
        
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
    
    
    .factory('saveAccountScheduleCalendar', ['$q', 'catchOutcome', function($q, catchOutcome) {

        /**
         * Save account schedule calendar in scope
         *
         */
        return function($scope) {
            var deferred = $q.defer();
            require(['services/saveAccountScheduleCalendar'], function(serviceFn) {
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
