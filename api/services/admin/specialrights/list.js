'use strict';

let SpecialRightIndex = require('./../../../specialrights/index');


exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the special rights list service
     *
     * @param {Object} params
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        let list;
        let index = new SpecialRightIndex();

        if (params.create) {
            list = index.getCreateList(app.db.models.Right);
        } else {
            list = index.getList();
        }

        service.outcome.success = true;
        service.deferred.resolve(list);

        return service.deferred.promise;
    };


    return service;
};

