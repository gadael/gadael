'use strict';


/**
 * The user adjustments list service
 * manual quantity adjustments on a renewal-user link
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


        var find = service.app.db.models.Adjustment.find({});

        find.populate('rightRenewal');

        find.where('user', params.user);

        if (undefined !== params.rightRenewal) {
            find.where('rightRenewal', params.rightRenewal);
        }

        next(find);

    }










    /**
     * Call the adjustment list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        if (undefined === params || !params.user) {
            service.error('The user parameter is mandatory');
            return service.deferred.promise;
        }


        getQuery(params, query => {


            service.resolveQuery(
                query,
                paginate,
                (err, docs) => {
                    if (service.handleMongoError(err))
                    {
                        // populate right document

                        let rightPromises = [];
                        let typesPromises = [];

                        docs.forEach(adjustment => {
                            let p = adjustment.rightRenewal.populate('right').execPopulate();
                            rightPromises.push(p);
                            p.then(() => {
                                // populate type document
                                typesPromises.push(adjustment.rightRenewal.right.populate('type').execPopulate());
                            });
                        });

                        Promise.all(rightPromises).then(() => {
                            Promise.all(typesPromises).then(() => {

                                // Add dispUnit on adjustment

                                let adjustmentObjects = [];

                                docs.forEach(function(adjustment) {
                                    let o = adjustment.toObject();

                                    o.disp_unit = adjustment.rightRenewal.right.getDispUnit(adjustment.quantity);
                                    adjustmentObjects.push(o);
                                });


                                service.outcome.success = true;
                                service.deferred.resolve(adjustmentObjects);
                            });
                        });
                    }
                }
            );
        });


        return service.deferred.promise;
    };


    return service;
};




