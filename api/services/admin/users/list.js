'use strict';



/**
 * The Admin users list service
 */


 function getArr(mixed) {
     if (mixed instanceof Array) {
         return mixed;
     }
     return [mixed];
 }



function getAccountsByCollection(service, params) {


    let dtstart = new Date();
    let dtend = new Date();

    // add a parameter for the period to test, with a default to current day
    if (params.collection_dtstart) {
        dtstart = params.collection_dtstart;
    }

    if (params.collection_dtend) {
        dtend = params.collection_dtend;
    }

    return service.app.db.models.AccountCollection.find()
    .where('rightCollection').in(getArr(params.collection))
    .where('from').lte(dtend)
    .or([{ to: null }, { to: { $gte: dtstart } }])
    .select('account')
    .exec()
    .then(docs => {
        return docs.map(ac => {
            return ac.account;
        });
    });
}



function getUsersByRight(service, params) {
    return service.app.db.models.Beneficiary.find()
    .where('ref', 'User')
    .where('right', params.right)
    .select('document')
    .exec()
    .then(docs => {
        return docs.map(b => {
            return b.document;
        });
    });
}






/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 * @param {function} next
 */
var query = function(service, params, next) {



    let find = service.app.db.models.User.find()
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


    let paramPromises = [];

    if (params.right) {
        // The "right" filter get users linked to a right out of collection
        paramPromises.push(
            getUsersByRight(service, params)
            .then(userIdList => {
                find.where('_id').in(userIdList);
                return true;
            })
        );
    }

    if (params.collection) {
        paramPromises.push(
            getAccountsByCollection(service, params)
            .then(accountIdList => {
                find.where('roles.account').in(accountIdList);
                return true;
            })
        );

    }

    Promise.all(paramPromises)
    .then(() => {
        next(find);
    });
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

            find.select('lastname firstname email roles isActive department validInterval').sort('lastname');

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
