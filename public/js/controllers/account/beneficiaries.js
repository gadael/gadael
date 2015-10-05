define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        function($scope, Rest) {

            var beneficiaries = Rest.account.beneficiaries.getResource();
            $scope.beneficiaries = beneficiaries.query();
	}];
});
