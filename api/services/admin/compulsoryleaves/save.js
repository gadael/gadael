'use strict';


const gt = require('./../../../../modules/gettext');


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['dtstart', 'dtend', 'name', 'userCreated', 'collections', 'departments', 'right'])) {
        return;
    }

    if (params.dtend <= params.dtstart) {
        return service.error(gt.gettext('Finish date must be greater than start date'));
    }

    if (params.collections.constructor !== Array) {
        return service.error(gt.gettext('collections must be an array'));
    }

    if (params.departments.constructor !== Array) {
        return service.error(gt.gettext('departments must be an array'));
    }

    if (params.departments.length === 0 && params.collections.length === 0) {
        return service.error(gt.gettext('either departments or collections must contain items'));
    }

    saveCompulsoryLeave(service, params);
}



function getIds(list) {
    return list.map(item => {
        if (typeof item === 'string') {
            return item;
        }

        if (item._id !== undefined) {
            return item._id;
        }

        throw new Error('wrong data type');
    });
}



/**
 * Update/create the compulsory leave document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveCompulsoryLeave(service, params) {


    var CompulsoryLeaveModel = service.app.db.models.CompulsoryLeave;

    let rightId;

    if (params.right._id === undefined) {
        rightId = params.right;
    } else {
        rightId = params.right._id;
    }

    var fieldsToSet = {
        name: params.name,
        dtstart: params.dtstart,
        dtend: params.dtend,
        lastUpdate: new Date(),
        userCreated: {
            id: params.userCreated._id,
            name: params.userCreated.getName()
        },
        comment: params.comment,
        collections: getIds(params.collections),
        departments: getIds(params.departments),
        right: rightId
    };





    if (params.id)
    {
        CompulsoryLeaveModel.findOne({ _id: params.id }, function(err, document) {
            if (service.handleMongoError(err))
            {
                document.set(fieldsToSet);
                document.save(function(err, document) {

                    if (service.handleMongoError(err)) {

                        service.resolveSuccess(
                            document,
                            gt.gettext('The compulsory leave period has been modified')
                        );

                    }

                });


            }
        });

    } else {

        var document = new CompulsoryLeaveModel();
        document.set(fieldsToSet);
        document.save(function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document,
                    gt.gettext('The compulsory leave period has been created')
                );
            }
        });
    }
}










/**
 * Construct the compulsory leave save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the compulsory leave save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};


