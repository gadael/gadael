'use strict';


/**
 * The user request list service
 */




/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {





    if (params['status.deleted'] === undefined) {
        params['status.deleted'] = [null, 'waiting'];
    } else if (!(params['status.deleted'] instanceof Array)) {
        params['status.deleted'] = [params['status.deleted']];
    }


    var find = service.app.db.models.Request.find();
    find.where('status.deleted').in(params['status.deleted']);

    if (params['status.created'] !== undefined) {
        if (!(params['status.created'] instanceof Array)) {
            params['status.created'] = [params['status.created']];
        }
        find.where('status.created').in(params['status.created']);
    }

    if (undefined !== params['user.id']) {
        find.where({ 'user.id': params['user.id'] });
    }

    if (undefined !== params['user.name']) {
        find.where({ 'user.name': new RegExp(params['user.name'], 'i') });
    }

    if (undefined !== params['user.department']) {
        find.where({ 'user.department': params['user.department'] });
    }


    if (undefined !== params.type) {
        switch(params.type) {
            case 'absence':
                find.where('absence.distribution', {$exists: true, $not: {$size: 0}});
                break;

            case 'time_saving_deposit':
                find.where('time_saving_deposit', {$exists: true, $not: {$size: 0}});
                break;

            case 'workperiod_recover':
                find.where('workperiod_recover', {$exists: true, $not: {$size: 0}});
                break;
        }
    }

    find.populate('absence.distribution');
    find.populate('absence.compulsoryLeave');
    find.populate('events');
    find.populate('user.id');

    return find;
};




exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the requests list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {


        var find = query(service, params)
            .select('user timeCreated createdBy events absence time_saving_deposit workperiod_recover approvalSteps status validInterval')
            .sort('-timeCreated');


        service.resolveQuery(find, paginate, function(err, docs) {

            var docsObj = [];

            if (!err && undefined !== docs) {

                for(var i=0; i<docs.length; i++) {
                    var reqObj = docs[i].toObject();
                    reqObj.status.title = docs[i].getDispStatus();
                    reqObj.events.map(function(event) {
                        if (undefined === event.uid) {
                            event.uid = event._id;
                        }
                        return event;
                    });

                    docsObj.push(reqObj);
                }
            }

            service.mongOutcome(err, docsObj);
        });

        return service.deferred.promise;
    };


    return service;
};
