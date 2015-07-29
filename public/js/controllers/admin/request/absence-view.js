define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        'AbsenceStat', function(
			$scope, 
			$location, 
			Rest,
            AbsenceStat
		) {
                

		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        AbsenceStat($scope);


        

		$scope.cancel = function() {
			$location.path('/admin/requests');
		};

	}];
});

