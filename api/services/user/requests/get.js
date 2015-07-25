'use strict';


exports = module.exports = function(services, app) {
    
    var dispunits = require('../../../../modules/dispunits');

    var Gettext = require('node-gettext');
    var gt = new Gettext();


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
        .populate('absence.distribution')
        .populate('approvalSteps.approvers', null, 'User')
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
                var elem;


                for(var r=0; r<document.absence.distribution.length; r++) {
                    elem = docObj.absence.distribution[r];
                    elem.right.dispUnit = dispunits(elem.right.quantity_unit, elem.quantity);
                    if (undefined !== events[elem.event]) {
                        elem.event = events[elem.event];
                    }
                }

                // add displayable status
                docObj.status.title = document.getDispStatus();


                service.outcome.success = true;
                service.deferred.resolve(docObj);
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


