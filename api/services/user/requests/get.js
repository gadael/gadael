'use strict';


exports = module.exports = function(services, app) {
    
    var dispunits = require('../../../../modules/dispunits');

    var Gettext = require('node-gettext');
    var gt = new Gettext();

    var jurassic = require('jurassic');
    var service = new services.get(app);
    
    /**
     * Call the request get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (params['status.deleted'] === undefined) {
            params['status.deleted'] = null;
        }

        var filter = {
            _id: params.id,
            'status.deleted': params['status.deleted']
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }

        
        
        



        service.app.db.models.Request
        .findOne(filter)
        .populate('events')
        .populate('user.id')
        .populate('absence.distribution')
        .populate('approvalSteps.approvers', null, 'User')
        .populate('requestLog.userCreated.id')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {

                if (!document) {
                    return service.notFound(gt.gettext('This request does not exists'));
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

                service.outcome.success = true;
                service.deferred.resolve(docObj);
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


