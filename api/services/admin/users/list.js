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

    var find = service.app.db.models.User.find()
        .populate('department')
        .populate('roles.account')
        .populate('roles.admin')
        .populate('roles.manager');
    
    if (!params) {
        return next(find);
    }

    if (params.name) {
        find.or([
            { firstname: new RegExp('^'+params.name, 'i') },
            { lastname: new RegExp('^'+params.name, 'i') }
        ]);
    }
    
    if (params.isAccount) {
        find.where('roles.account').exists();
    }
    
    if (params.isAdmin) {
        find.where('roles.admin').exists();
    }
    
    if (params.isManager) {
        find.where('roles.manager').exists();
    }

    if (params.department) {
        find.where('department').equals(params.department);
    }

    if (params.collection) {
        var collFind = service.app.db.models.AccountCollection.find();
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
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
        
        query(service, params, function(find) {
            
            find.select('lastname firstname email image roles isActive department').sort('lastname');
            
            service.resolveQuery(find, paginate, function(err, docs) {
                if (service.handleMongoError(err)) {
                    
                    var promises = [];
                    var userComplete= require('../../../../modules/userComplete');
                    
                    for(var i=0; i<docs.length; i++) {
                        promises.push(userComplete(docs[i]));
                    }
                    
                    var Q = require('q');
                    
                    Q.all(promises).then(function(objects) {
                        service.outcome.success = true;
                        service.deferred.resolve(objects);
                    }).catch(function(err) {
                        service.outcome.success = false;
                        service.deferred.reject(err);
                    });
                }
            });
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




