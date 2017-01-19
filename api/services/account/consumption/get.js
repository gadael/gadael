'use strict';

const saveAbsence = require('../../user/requests/saveAbsence');



exports = module.exports = function(services, app) {

    let service = new services.get(app);

    const gt = app.utility.gettext;

    function checkParams(params) {
        if (!params.user) {
            throw new Error(gt.gettext('user parameter is mandatory'));
        }

        if (!params.selection.begin) {
            throw new Error(gt.gettext('selection.begin parameter is mandatory'));
        }

        if (!params.selection.end) {
            throw new Error(gt.gettext('selection.end parameter is mandatory'));
        }

        return true;
    }



    /**
     * create fake elements from the distribution parameter
     * @param {apiService} service
     * @param {RightCollection} collection
     * @param {Object} distribution
     * @return {Promise}
     */
    function getElements(service, collection, distribution)
    {
        let renewals = [];
        let elements = [];
        const RightRenewal = service.app.db.models.RightRenewal;
        const Element = service.app.db.models.Element;

        for (var id in distribution) {
            if (distribution.hasOwnProperty(id)) {
                renewals.push(id);
            }
        }

        return RightRenewal.find()
        .where('_id').in(renewals)
        .populate('right')
        .exec()
        .then(arr => {

            arr.forEach(renewal => {
                let element = new Element();
                element.quantity = distribution[renewal.id].quantity;
                renewal.right.getConsumedQuantity(collection, element);
            });


            return elements;
        });
    }


    /**
     *
     */
    function getConsumption(service, params) {

        service.app.db.models.User.findOne()
        .where('_id', params.user)
        .populate('roles.account')
        .exec()
        .then(user => {
            if (!user) {
                service.notFound(gt.gettext('Failed to load the user document'));
            }


        })
        .catch(service.error);
    }






    /**
     *
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        try {
            checkParams(params);
            getConsumption(service, params);
        } catch(e) {
            service.error(e.message);
        }

        return service.deferred.promise;
    };


    return service;
};
