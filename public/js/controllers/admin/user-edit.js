define([], function() {
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions',
		'loadWorkschedulesOptions',
		'loadNonWorkingDaysOptions',
		'$resource',
        '$q',
        'SaveResource', function(
			$scope, 
			$location, 
			IngaResource, 
			loadCollectionsOptions, 
			loadDepartmentsOptions, 
			loadWorkschedulesOptions, 
			loadNonWorkingDaysOptions,
			$resource,
            $q,
            SaveResource
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();
		
		$scope.user.$promise.then(function() {
			
			$scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined);
			$scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined);
			$scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined);
			
		});
		
		
		loadCollectionsOptions($scope);
		loadDepartmentsOptions($scope);
		loadWorkschedulesOptions($scope);
		loadNonWorkingDaysOptions($scope);
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		}
        
        
        
        /**
         * Save all account collections
         * 
         */
        var saveAccountCollection = function() {
            
            var promises = [];
            
            for(var i=0; i<$scope.accountCollections.length; i++) {
                promises.push(SaveResource($scope.accountCollections[i]));
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
	    }
	    
	    var accountCollection = $resource('rest/admin/accountcollections/:accCollId',
            { accCollId:'@_id' }, 
            { 'save': { method:'PUT' }}  // overwrite default save method (POST)
        );
	    
	    $scope.user.$promise.then(function() {
            
            // after user resource loaded, load account Collections
            
			if ($scope.user.roles !== undefined && $scope.user.roles.account !== undefined) {
				$scope.accountCollections = accountCollection.query({ account: $scope.user.roles.account._id });
			} else {
				$scope.accountCollections = [];
			}
			
			if (0 === $scope.accountCollections.length) {
				$scope.addAccountCollection();
			}
		});
		
        
        /**
         * Add a row to account collection list
         */
		$scope.addAccountCollection = function() {
			
			var length = $scope.accountCollections.length;
			if (length > 0) {
				var lastItem = $scope.accountCollections[length - 1];
				
				if (!lastItem.to) {
					lastItem.to = new Date(Math.max.apply(null,[lastItem.from, new Date()]));
					lastItem.to.setDate(lastItem.to.getDate()+1);
				}
				
				var nextDate = new Date(lastItem.to);
				nextDate.setDate(nextDate.getDate()+1);
			} else {
				var nextDate = new Date();
			}
			
			var newAc = new accountCollection;
            
            newAc.account = $scope.user.roles.account._id;
			newAc.rightCollection = null;
			newAc.from = nextDate;
			newAc.to = null;
			
			$scope.accountCollections.push(newAc);
		};
		
		
		
		$scope.fromIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return (undefined !== item._id && item.from < Date.now());
		};
		
		$scope.toIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return (undefined !== item._id && item.to < Date.now());
		};
		
		$scope.removeIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return $scope.fromIsDisabled(item);
		};
		
		
		
		$scope.removeAccountCollection = function(index) {
			$scope.accountCollections.splice(index, 1);
		};
		
	}];
});

