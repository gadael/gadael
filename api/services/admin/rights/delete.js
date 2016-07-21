'use strict';

const gt = require('./../../../../modules/gettext');
const util = require('util');

exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the vacation right delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        let Right = service.app.db.models.Right;
        let rightDoc;
        
        Right.findById(params.id).exec()
        .then(document => {
            rightDoc = document;
            return document.countUses();
        })
        .then(uses => {
            if (uses > 0) {
                throw new Error(util.format(gt.gettext('Failed to delete, the right is used %d in requests'), uses));
            }

            return service.get(rightDoc._id);

        })
        .then(serviceOutput => {

            return rightDoc.remove()
            .then(() => {
                service.resolveSuccess(serviceOutput, gt.gettext('The leave right has been deleted'));
            });
        })
        .catch(service.error);
        
        return service.deferred.promise;
    };
    
    
    return service;
};

