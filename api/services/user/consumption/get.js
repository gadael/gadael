'use strict';

const saveAbsence = require('../requests/saveAbsence');



exports = module.exports = function(services, app) {

    let service = new services.get(app);

    const gt = app.utility.gettext;



    function checkParams(params) {

        if (!params.user) {
            throw new Error(gt.gettext('user parameter is mandatory'));
        }

        if (!params.collection) {
            throw new Error(gt.gettext('collection parameter is mandatory'));
        }

        if (!params.selection.begin) {
            throw new Error(gt.gettext('selection.begin parameter is mandatory'));
        }

        if (!params.selection.end) {
            throw new Error(gt.gettext('selection.end parameter is mandatory'));
        }

        if (!params.distribution) {
            throw new Error(gt.gettext('distribution parameter is mandatory'));
        }

        return true;
    }





    /**
     * Create element object from posted informations
     * @param {apiService} service
     * @param {User} user                   The user document
     * @param {object} elem                 elem object from params
     * @param {RightCollection} collection
     * @param {Function} setElemProperties
     * @return {Promise}
     */
    function createElement(elem, setElemProperties)
    {

        if (undefined === elem.right) {
            throw new Error('element must contain a right property');
        }

        if (undefined === elem.right.id) {
            throw new Error('element must contain a right.id property');
        }

        if (undefined === elem.events) {
            throw new Error('element must contain an events property');
        }

        if (0 === elem.events.length) {
            throw new Error('element.events must contain one event');
        }

        if (undefined === elem.quantity) {
            throw new Error('element must contain a quantity property');
        }

        let ElementModel = service.app.db.models.AbsenceElem;

        // create new element
        return setElemProperties(new ElementModel(), elem);
    }





    function getUser(id)
    {
        return service.app.db.models.User.findOne()
        .where('_id', id)
        .populate('roles.account')
        .exec()
        .then(user => {
            if (!user) {
                throw new Error(gt.gettext('Failed to load the user document'));
            }

            return user;
        });
    }

    function getCollection(id)
    {
        return service.app.db.models.RightCollection.findOne()
        .where('_id', id)
        .exec()
        .then(collection => {
            if (!collection) {
                throw new Error(gt.gettext('Failed to load the collection document'));
            }

            return collection;
        });
    }


    /**
     *
     */
    function getConsumption(params) {

        Promise.all([getUser(params.user), getCollection(params.collection)])
        .then(arr => {
            let user = arr[0];
            let collection = arr[1];
            let setElemProperties = saveAbsence.getElementIgniter(service, collection, user);
            let promises = [];

            for(let i=0; i<params.distribution.length; i++) {
                let elem = params.distribution[i];
                promises.push(createElement(elem, setElemProperties));
            }

            /*
             createElement resolve to a list of
                 {
                     element: element,
                     user: user,
                     right: rightDocument,
                     renewal: renewalDocument
                 }
            */

            Promise.all(promises)
            .then(objects => {
                let consumption = {};
                objects.forEach(o => {
                    consumption[o.renewal.id] = o.element.consumedQuantity;
                });
                service.deferred.resolve(consumption);
            })
            .catch(service.error);
        })
        .catch(service.notFound);

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
        } catch(e) {
            service.error(e.message);
        }

        getConsumption(params);

        return service.deferred.promise;
    };


    return service;
};
