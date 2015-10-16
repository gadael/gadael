define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        'Beneficiary',
        function($scope, Rest, Beneficiary) {

            var beneficiaryContainer = Rest.account.beneficiaries.getFromUrl().loadRouteId();
            var adjustmentResource = Rest.account.adjustments.getResource();
            var requestResource = Rest.account.requests.getResource();

            var requests = requestResource.query({
                absence: true
            });

            Beneficiary.processBeneficiary($scope, beneficiaryContainer, requests, function(renewalId, callback) {
                return adjustmentResource.query({ rightRenewal: renewalId }, callback);
            });

	    }
    ];
});
