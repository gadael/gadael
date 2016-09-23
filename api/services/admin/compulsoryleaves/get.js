'use strict';


exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;
    const dispunits = app.utility.dispunits;

    /**
     * Call the compulsory leave get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.CompulsoryLeave
        .findOne({ _id : params.id })
        .populate('right')
        .populate('departments')
        .populate('collections')
        .exec()
        .then(document => {

            if(!document) {
                return service.notFound(gt.gettext('This compulsory leave does not exists'));
            }

            return document.right.populate('type').execPopulate().then(() => {
                return document;
            });
        })
        .then(document => {

            let compulsoryLeaveObject = document.toObject();
            for (let i=0; i<document.requests.length; i++) {
                compulsoryLeaveObject.requests[i].disp_unit = dispunits(document.right.quantity_unit, document.requests[i].quantity);
            }

            service.outcome.success = true;
            service.deferred.resolve(compulsoryLeaveObject);
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};
