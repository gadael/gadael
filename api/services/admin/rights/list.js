'use strict';


/**
 * The Admin vacation rights list service
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

    var find = service.models.Right.find();

    if (params.name) {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }
    
    if (params.type) {
        find.where({ type: params.type });
    }
    
    find.populate('type');
    
    return find;
};



/**
 * process the mongoose documents resultset to an array of objects with additional content
 * like the current renewal
 * @param {Array} docs mongoose documents
 * 
 */
function getResultSet(docs, callback) {
    var async = require('async');
    
    async.map(
        docs, 
        function(doc, done) {
            var right = doc.toObject();
            
            doc.getLastRenewal()
                .then(function(lastRenewal) {
                    right.lastRenewal = lastRenewal;
                    return doc.getCurrentRenewal();
                })
                .then(function(currentRenewal) {
                    right.currentRenewal = currentRenewal;
                    done(null, right);
                })
                .catch(function(err) {
                    done(err);
                });
        }, 
        callback
    );
}



exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the vacation rights list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'name description type quantity quantity_unit';
        var sortkey = 'sortkey';
        
        service.resolveQuery(
            query(service, params),
            cols,
            sortkey,
            paginate,
            function(err, docs) {
                getResultSet(docs, service.mongOutcome);
            }
        );

        return service.deferred.promise;
    };
    
    
    return service;
};




