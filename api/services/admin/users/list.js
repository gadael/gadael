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

    function getArr(mixed) {
        if (mixed instanceof Array) {
            return mixed;
        }
        return [mixed];
    }

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
        find.where('department').in(getArr(params.department));
    }

    if (params.collection) {
        let collFind = service.app.db.models.AccountCollection.find();
        collFind.where('rightCollection').in(getArr(params.collection));

        let dtstart = new Date();
        let dtend = new Date();

        // add a parameter for the period to test, with a default to current day
        if (params.collection_dtstart) {
            dtstart = params.collection_dtstart;
        }

        if (params.collection_dtend) {
            dtend = params.collection_dtend;
        }

        collFind.where('from').lte(dtend)
                .or([{ to: null }, { to: { $gte: dtstart } }]);

        collFind.select('account');

        collFind.exec(function (err, docs) {
            if (service.handleMongoError(err))
            {
                var accountIdList = [];
                for(var i=0; i<docs.length; i++) {
                    accountIdList.push(docs[i].account);
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
            
            find.select('lastname firstname email image roles isActive department validInterval').sort('lastname');
            
            service.resolveQuery(find, paginate, function(err, docs) {
                if (service.handleMongoError(err)) {
                    
                    var promises = [];
                    var userComplete= require('../../../../modules/userComplete');
                    
                    for(var i=0; i<docs.length; i++) {
                        promises.push(userComplete(docs[i]));
                    }

                    
                    Promise.all(promises).then(function(objects) {
                        service.outcome.success = true;
                        service.deferred.resolve(objects);
                    }).catch(service.error);
                }
            });
        });
        
        
        return service.deferred.promise;
    };
    
    
    return service;
};




