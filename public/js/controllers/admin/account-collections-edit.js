define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'loadCollectionsOptions', 
		'$resource',
        '$q',
        'catchOutcome',
        'saveAccountCollection',
        'addPeriodRow', function(
			$scope, 
			$location, 
			IngaResource, 
			loadCollectionsOptions, 
			$resource,
            $q,
            catchOutcome,
            saveAccountCollection,
            addPeriodRow
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                // after user resource loaded, load account Collections
                
                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountCollections = accountCollection.query(
                        { account: $scope.user.roles.account._id }, function() {
                            if (0 === $scope.accountCollections.length) {
                                $scope.addAccountCollection();
                            }
                        }
                    );
                } else {
                    $scope.accountCollections = [];
                    $scope.addAccountCollection();
                }
            });
        }
		
		loadCollectionsOptions($scope);

		
		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};
                
                

		/**
         * Save button
         */
		$scope.saveAccountCollections = function() {
            saveAccountCollection($scope).then($scope.cancel);
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
            addPeriodRow($scope, $scope.accountCollections, accountCollection);
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
            
            catchOutcome(p);
		};
		
	}];
});

