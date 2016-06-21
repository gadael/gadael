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
        

        
        service.app.db.models.Right.findById(params.id, function (err, document) {

            if (service.handleMongoError(err)) {

                // TODO: do not accept delete if used in requests
                document.countUses().then(uses => {
                    if (uses > 0) {
                        return service.error(util.format(gt.gettext('Failed to delete, the right is used %d in requests'), uses));
                    }

                    document.remove(function(err) {
                        if (service.handleMongoError(err)) {
                            service.success(gt.gettext('The leave right has been deleted'));

                            var right = document.toObject();
                            right.$outcome = service.outcome;

                            service.deferred.resolve(right);
                        }
                    });
                });


            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

