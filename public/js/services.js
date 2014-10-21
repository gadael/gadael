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
     * catch workflow messages from the rest service and 
     *  - forward messages to rootscope
     *  - highlight the missing fields
     */
    .factory('catchOutcome', ['$rootScope', function($rootScope) {
        
        
        var addMessages = function(outcome) {
            for(var i=0; i<outcome.alert.length; i++) {
                $rootScope.pageAlerts.push(outcome.alert[i]);
            }
        };
        
        /**
         * 
         * @return promise
         */
        return function(promise) {
            
            return promise.then(
                function(data) {
                    if (data.$outcome) {
                        addMessages(data.$outcome);
                    }
                    
                    // workflow return the saved document object
                    // value is fowarded to the next promise on success
                    return data;
                    
                },
                function(badRequest) {
                    
                    var data = badRequest.data;
                    var outcome = data.$outcome;
                    
                    if (!outcome) {
                        return;
                    }
                    
                    addMessages(outcome);

                    // receive 400 bad request on missing parameters
                    // mark required fields
                    
                    for(var fname in outcome.errfor) {
                        if ('required' === outcome.errfor[fname]) {
                            angular.element(document.querySelector('[ng-model$='+fname+']')).parent().addClass('has-error');
                        }
                    }
                }
            ); 
        };
        
    }])


	/**
	 * Create a resource to an object or to a collection
	 * the object resource is created only if the angular route contain a :id
	 */ 
	.factory('IngaResource', ['$resource', '$routeParams', 'catchOutcome', function($resource, $routeParams, catchOutcome){
		

		return function(collectionPath)
		{
			var ingaSave = function(nextaction) {
                
                var p = catchOutcome(this.$save());
                
                if (nextaction) {
                    p = p.then(nextaction);
                }

                return p;
			};
			
			
			if ($routeParams.id)
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
				
				var inst = new collection();
				inst.ingaSave = ingaSave;

				return inst;
			};
			
			return collection;
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
        }
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
        }
	}]);
	
	
});
