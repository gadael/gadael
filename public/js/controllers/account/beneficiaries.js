define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        function($scope, Rest) {

            var beneficiaries = Rest.account.beneficiaries.getResource();
            $scope.beneficiaries = beneficiaries.query();

            $scope.getCurrentPeriod = function(renewals) {
                var renewal, today = new Date();
                for(var i=0; i<renewals.length; i++) {
                    renewal = renewals[i];
                    if (renewal.start <= today && today <= renewal.finish) {
                        return renewal;
                    }
                }

                return null;
            };
	}];
});
