'use strict';

const jurassic = require('jurassic');


exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;
    const dispunits = app.utility.dispunits;

    var service = new services.get(app);

    /**
     * Call the request get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var filter = {
            _id: params.id
        };

        if (params.user) {
            filter['user.id'] = params.user;
        }

        // special parameter set in controller
        // admin can view deleted requests
        let accessDeleted = false;
        if (undefined !== params.accessDeleted) {
            accessDeleted = params.accessDeleted;
        }



        service.app.db.models.Request
        .findOne(filter)
        .populate('events')
        .populate('user.id')
        .populate('absence.distribution')
        .populate('absence.compulsoryLeave')
        .populate('workperiod_recover.recoverQuantity')
        .populate('approvalSteps.approvers', null, 'User')
        .populate('requestLog.userCreated.id')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {

                if (!document) {
                    return service.notFound(gt.gettext('This request does not exists'));
                }

                if (!accessDeleted && document.status.deleted === 'accepted') {
                    return service.gone(gt.gettext('This request has been deleted'));
                }

                // prepare events

                var events = {};
                for(var e=0; e<document.events.length; e++) {
                    events[document.events[e]._id] = document.events[e].toObject();
                }


                // add display unit
                // add a reference to event in the elements


                var docObj = document.toObject();



                // get a displayable status for each approval steps
                if (undefined !== docObj.approvalSteps) {
                    for(var i=0; i<docObj.approvalSteps.length; i++) {
                        docObj.approvalSteps[i].dispStatus = document.approvalSteps[i].getDispStatus();
                    }
                }


                var elem, newEvents;

                var eachEventId = function(elemEvtId) {
                    if (undefined !== events[elemEvtId]) {
                        newEvents.push(events[elemEvtId]);
                    }
                };

                for(var r=0; r<document.absence.distribution.length; r++) {
                    elem = docObj.absence.distribution[r];
                    elem.right.dispUnit = dispunits(elem.right.quantity_unit, elem.quantity);

                    // replace events id by objects
                    newEvents = [];
                    elem.events.forEach(eachEventId);
                    elem.events = newEvents;
                }

                // add displayable status
                docObj.status.title = document.getDispStatus();


                // complete request log with action summary
                for (var a=0; a<document.requestLog.length; a++) {
                    docObj.requestLog[a].actionSummary = document.requestLog[a].getActionSummary();
                }


                docObj.events.map(function(event) {
                    if (undefined === event.uid) {
                        event.uid = event._id;
                    }

                    if (undefined === event.businessDays) {
                        var period = new jurassic.Period();
                        period.dtstart = event.dtstart;
                        period.dtend = event.dtend;
                        event.businessDays = period.getBusinessDays();
                    }

                    return event;
                });


                docObj.workperiod_recover.map(function(recover) {
                    if (undefined !== recover.recoverQuantity && undefined !== recover.recoverQuantity._id) {
                        var recoverQuantity = recover.recoverQuantity;
                        recoverQuantity.quantity_dispUnit = dispunits(recoverQuantity.quantity_unit, recoverQuantity.quantity);
                    }

                    if (undefined !== recover.right) {
                        recover.right.quantity_dispUnit = dispunits(recover.right.quantity_unit, recover.quantity);
                    }
                    return recover;
                });


                docObj.time_saving_deposit.map(function(deposit) {
                    deposit.quantity_dispUnit = dispunits(deposit.quantity_unit, deposit.quantity);
                    return deposit;
                });


                service.outcome.success = true;
                service.deferred.resolve(docObj);
            }
        });

        return service.deferred.promise;
    };


    return service;
};
