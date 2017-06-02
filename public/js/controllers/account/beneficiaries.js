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

            $scope.beneficiaries.$promise.then(function() {
                // filter out hidden rights

                $scope.beneficiaries = $scope.beneficiaries.filter(function(b) {
                    return !b.right.hide;
                });
            });

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
