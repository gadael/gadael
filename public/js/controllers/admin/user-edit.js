define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions',
		'loadWorkschedulesOptions',
		'$resource',
        '$q',
        'catchWorkflow', function(
			$scope, 
			$location, 
			IngaResource, 
			loadCollectionsOptions, 
			loadDepartmentsOptions, 
			loadWorkschedulesOptions, 
			$resource,
            $q,
            catchWorkflow
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);
                
                // after user resource loaded, load account Collections
                
                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountCollections = accountCollection.query({ account: $scope.user.roles.account._id });
                } else {
                    $scope.accountCollections = [];
                }
                
                if (0 === $scope.accountCollections.length) {
                    $scope.addAccountCollection();
                }
                
            });
        }
		
		loadCollectionsOptions($scope);
		loadDepartmentsOptions($scope);
		loadWorkschedulesOptions($scope);
		
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		};
        
        
        
        /**
         * Save all account collections
         * 
         */
        var saveAccountCollection = function(userId) {
            
            
            if (!$scope.user.roles || !$scope.user.roles.account) {
                // TODO remove the existing collections
                return;
            }
            
            var promises = [];
            
            
            for(var i=0; i<$scope.accountCollections.length; i++) {
                
                var document = $scope.accountCollections[i];
                if ($scope.user.roles && $scope.user.roles.account) {
                    document.account = $scope.user.roles.account;
                } else {
                    document.user = userId;
                }
                
                var p;
                
                if (document._id) {
                    p = $scope.accountCollections[i].$save();
                } else {
                    p = $scope.accountCollections[i].$create();
                }
                promises.push(catchWorkflow(p));
            }
            
            var promise = $q.all(promises);
            
            return promise;
        };
		
		/**
         * Save button
         */
		$scope.saveUser = function() {
			$scope.user.ingaSave()
            .then(saveAccountCollection)
            .then($scope.cancel);
	    };
	    
	    var accountCollection = $resource('rest/admin/accountcollections/:accCollId',
            { accCollId:'@_id' }, 
            { 
                'save': { method:'PUT' },    // overwrite default save method (POST)
                'create': { method:'POST' }
            }  
        );

		
        
        /**
         * Add a row to account collection list
         */
		$scope.addAccountCollection = function() {
			
            var nextDate;
			var length = $scope.accountCollections.length;
			if (length > 0) {
				var lastItem = $scope.accountCollections[length - 1];
				
				if (!lastItem.to) {
                    
                    var from = new Date(lastItem.from);
                    var today = new Date();
                    
                    var maxTime = Math.max.apply(null,[from.getTime(), today.getTime()]);
                    
                    lastItem.to = new Date();
					lastItem.to.setTime(maxTime);
                    lastItem.to.setHours(0);
                    lastItem.to.setMinutes(0);
                    lastItem.to.setSeconds(0);
                    
                    
					lastItem.to.setDate(lastItem.to.getDate()+1);
				}
				
                
				nextDate = new Date(lastItem.to);
				nextDate.setDate(nextDate.getDate()+1);
			} else {
				nextDate = new Date();
			}
            
            
			
			var newAc = new accountCollection();
            
			newAc.rightCollection = null;
			newAc.from = nextDate;
			newAc.to = null;
			
			$scope.accountCollections.push(newAc);
		};
		
		
		
		$scope.fromIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return (undefined !== item._id && item.from && item.from < Date.now());
		};
		
		$scope.toIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return (undefined !== item._id && item.to && item.to < Date.now());
		};
		
		$scope.removeIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return $scope.fromIsDisabled(item);
		};
		
		
		/**
         * Delete
         */
		$scope.removeAccountCollection = function(index) {
            var accountCollection = $scope.accountCollections[index];
            catchWorkflow(accountCollection.$delete());
            
			$scope.accountCollections.splice(index, 1);
		};
		
	}];
});

