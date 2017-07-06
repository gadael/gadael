'use strict';

/**
 * The Admin department list service
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

    var find = service.app.db.models.Department.find();

    if (params && params.name)
    {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    return find;
};




exports = module.exports = function(services, app) {

    var service = new services.list(app);


    /**
     * Call the departments list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        service.resolveQuery(
            query(service, params).select('name operator path parent minActiveUsers').sort('name'),
            paginate,
            function(err, docs) {

                var subtreePromises = [];
                var objects = docs.map(function(department) {
                    var o = department.toObject();
                    subtreePromises.push(department.getSubTree());
                    return o;
                });

                Promise.all(subtreePromises).then(function(resolvedTrees) {
                    for (var i=0; i<objects.length; i++) {
                        objects[i].children = resolvedTrees[i];
                    }

                    service.deferred.resolve(objects);
                });
            }
        );

        return service.deferred.promise;
    };


    return service;
};
