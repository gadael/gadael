define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'loadCollectionsOptions', 
		'$resource',
        '$q',
        'catchWorkflow',
        'addPeriodRow', function(
			$scope, 
			$location, 
			IngaResource, 
			loadCollectionsOptions, 
			$resource,
            $q,
            catchWorkflow,
            addPeriodRow
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
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

		
		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
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
		$scope.saveAccountCollections = function() {
            saveAccountCollection()
            .then($scope.cancel);
	    };
	    
        /**
         * The account collection ressource
         */
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
            addPeriodRow($scope.accountCollections, accountCollection);
            /*
            addPeriodRow.then(function(process) {
                process($scope.accountCollections, accountCollection);
            });
            */
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

            if (undefined === accountCollection._id || null === accountCollection._id) {
                $scope.accountCollections.splice(index, 1);
                return;
            }
            
            var p = accountCollection.$delete().then(function() {
                $scope.accountCollections.splice(index, 1);
            });
            
            catchWorkflow(p);
		};
		
	}];
});

