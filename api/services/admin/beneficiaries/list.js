'use strict';

/**
 * The Admin beneficiaries list service
 */








/**
 * Export list service
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);





    /**
     * Create the query with filters
     *
     * @param {array} params      query parameters if called by controller
     * @param {function} next
     *
     */
    function getQuery(params, next) {


        var find = service.app.db.models.Beneficiary.find({
            ref: params.ref,
            document: params.document
        });

        find.populate('right');

        next(find);

    }





     /**
     *
     *
     */
    function resolveBeneficiaries(beneficiaries)
    {
        var output = [];


        beneficiaries.forEach(function(beneficiaryDocument) {

            var rightDocument = beneficiaryDocument.right;
            var beneficiary = beneficiaryDocument.toObject();
            beneficiary.disp_unit = rightDocument.getDispUnit();
            output.push(beneficiary);


        });

        service.outcome.success = true;
        service.deferred.resolve(output);
    }






    /**
     * Call the beneficiaries list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        if (undefined === params || !params.ref) {
            service.error('The ref parameter is mandatory');
            return service.deferred.promise;
        }


        switch(params.ref) {
            case 'RightCollection':
            case 'User':
                break;
            default:
                service.error('Unauthorized value for ref');
                return service.deferred.promise;
        }


        if (undefined === params || !params.document) {
            service.error('The document parameter is mandatory');
            return service.deferred.promise;
        }



        getQuery(params, function(query) {

            query.sort('right.name');

            var populatedTypePromises = [];

            service.resolveQuery(
                query,
                paginate,
                function(err, docs) {
                    if (service.handleMongoError(err))
                    {
                        // populate type in right, wait for resolution of all promises before
                        // resolving the service


                        for(var i=0; i<docs.length; i++) {
                            populatedTypePromises.push(docs[i].right.populate('type').execPopulate());
                        }

                        Promise.all(populatedTypePromises).then(function() {

                            resolveBeneficiaries(docs);

                        }).catch(function(err) {
                            service.error(err.message);
                        });
                    }
                }
            );
        });


        return service.deferred.promise;
    };


    return service;
};
