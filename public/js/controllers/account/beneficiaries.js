define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        'gettext',
        function($scope, Rest, gettext) {

            $scope.setPageTitle(gettext('Absence rights'));

            var beneficiaries = Rest.account.beneficiaries.getResource();
            $scope.beneficiaries = beneficiaries.query();

            console.log($scope.beneficiaries.$resolved);

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
