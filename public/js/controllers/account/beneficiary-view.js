define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        function($scope, Rest) {

            $scope.beneficiary = Rest.account.beneficiaries.getFromUrl().loadRouteId();
	}];
});
