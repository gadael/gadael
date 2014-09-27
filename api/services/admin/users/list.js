'use strict';


/**
 * The Admin users list service
 */




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 * @param {function} next
 */
var query = function(service, params, next) {

    var find = service.models.User.find();

    if (params.name)
    {
        find.or([
            { firstname: new RegExp('^'+params.name, 'i') },
            { lastname: new RegExp('^'+params.name, 'i') }
        ]);

    }

    if (params.department)
    {
        find.where('department').equals(params.department);

    }

    if (params.collection)
    {
        var collFind = service.models.AccountCollection.find();
        collFind.where('rightCollection').equals(params.collection);
        collFind.select('account');

        collFind.exec(function (err, docs) {
            if (service.handleMongoError(err))
            {
                var accountIdList = [];
                for(var i=0; i<docs.length; i++) {
                    accountIdList.push(docs[i]._id);
                }

                find.where('roles.account').in(accountIdList);
                next(find);
            }
        });

    } else {
        next(find);
    }
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the users list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Query}
     */
    service.call = function(params, paginate) {
        
        query(service, params, function(find) {
            
            var cols = 'lastname firstname email roles isActive';
            var sortkey = 'lastname';
            
            service.resolveQuery(find, cols, sortkey, paginate);
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




