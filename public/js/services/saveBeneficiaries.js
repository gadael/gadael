define([], function() {

    'use strict';

    /**
     * Save one row
     * @param   {$resource}   resource
     * @returns {Promise}
     */
    var saveRow = function($q, resource) {

        var deferred = $q.defer();

        if (resource._id) {

            resource.$save(function(data) {
                deferred.resolve(data);
            },function(data) {
                deferred.reject(data);
            });

        } else {
            resource.$create(function(data) {
                deferred.resolve(data);
            },function(data) {
                deferred.reject(data);
            });
        }

        return deferred.promise;
    };



    /**
     * Save all beneficiaries
     *
     */
    return function(beneficiaries, ref, documentId, $q, catchOutcome) {

        var promises = [];

        beneficiaries.forEach(function(beneficiary) {

            beneficiary.document = documentId;
            beneficiary.ref = ref;

            promises.push(catchOutcome(saveRow($q, beneficiary)));
        });

        var promise = $q.all(promises);

        return promise;
    };
});
