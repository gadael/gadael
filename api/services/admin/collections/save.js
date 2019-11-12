'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    const gt = service.app.utility.gettext;

    function hasOneBusinessDay() {
        for (let d in params.businessDays) {
            if (params.businessDays.hasOwnProperty(d)) {
                if (params.businessDays[d]) {
                    return true;
                }
            }
        }

        return false;
    }

    if (undefined !== params.businessDays) {
        // ensure at least one business day in week

        if (!hasOneBusinessDay()) {
            service.error(gt.gettext('At least one business day is required'));
        }
    }


    if (service.needRequiredFields(params, ['name'])) {
        return;
    }

    saveCollection(service, params);
}


/**
 * Refresh users cache
 *
 * @return {Promise}
 */
function refreshUserCache(service, collection) {

    const postpone = service.app.utility.postpone;
    const AccountCollection = service.app.db.models.AccountCollection;

    function task() {
        return AccountCollection.find()
        .where('rightCollection', collection._id)
        .populate('account')
        .exec()
        .then(list => {
            if (service.app.config.useSchudeledRefreshStat) {
                // mark account as refreshable by the refreshstat
                const accountIds = list.map(ac => ac.account._id);
                return service.app.db.models.Account.updateMany(
                    { _id: { $in: accountIds } },
                    { $set: { renewalStatsOutofDate: true } }
                ).exec();
            }

            return Promise.all(
                list.map(ac => ac.getUser())
            );
        })
        .then(users => {
            return Promise.all(
                users.map(user => user.updateRenewalsStat())
            );
        });
    }

    return postpone(task)
    .then(() => {
        return collection;
    });
}



/**
 * Update/create the collection document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveCollection(service, params) {

    const gt = service.app.utility.gettext;


    let fieldsToSet = {
        name: params.name
    };


    if (params.attendance !== undefined) {
        fieldsToSet.attendance = params.attendance;
    }

    if (params.businessDays !== undefined) {
        fieldsToSet.businessDays = params.businessDays;
    }

    if (params.workedDays !== undefined) {
        fieldsToSet.workedDays = params.workedDays;
    }

    if (params.useWorkschedule !== undefined) {
        fieldsToSet.useWorkschedule = params.useWorkschedule;
    }

    if (params.customScheduleDays !== undefined) {
        fieldsToSet.customScheduleDays = params.customScheduleDays;
    }


    let RightCollection = service.app.db.models.RightCollection;

    if (params.id)
    {
        RightCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err))
            {
                document.set(fieldsToSet);

                document.save()
                .then(document => {
                    return refreshUserCache(service, document);
                })
                .then(document => {
                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The collection has been modified')
                    );
                })
                .catch(service.error);

            }
        });

    } else {

        let collection = new RightCollection();
        collection.set(fieldsToSet);

        collection.save()
        .then(document => {
            service.resolveSuccessGet(
                document._id,
                gt.gettext('The collection has been created')
            );
        })
        .catch(service.error);
    }
}




exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the collection save service
     *
     * @param {Object} params
     *
     * @return {Query}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};
