


/**
 * Base class for a controller
 *
 * @constructor
 *
 * @param {string} method         HTTP request method
 * @param {string} path           route path
 */
function restController(method, path) {

    'use strict';

    /*jshint validthis: true */

    this.method = method;
    this.path = path;
    this.controllerAction = null;

    /**
     * Parameters given to service (cannot be overloaded with query params)
     * @var {Object}
     */
    this.forcedParameters = {};

    /**
     * Ignore empty parameter in request if set to true
     * This can be usefull for search parameters given to a REST service, if empty string parmeters
     * are ignored, the associated service will not have to test this bebore doing the query
     * Forced parameters are not subject to this rule
     *
     * @var {Boolean}
     */
    this.ignoreEmptyParams = false;


    var ctrl = this;


    /**
     * Method called when the controller route path is fired by the app
     * the controllerAction() method will be called at the end
     * to process the controller specific action
     *
     * @param {Request} req
     * @param {Response} res
     *
     * @return {Promise}
     */
    this.onRequest = function(req, res, next) {

        var Q = require('q');
        var deferred = Q.defer();

        ctrl.req = req;
        ctrl.res = res;
        ctrl.next = next;


        var workflow = require('./workflow');
        ctrl.workflow = workflow(req, res);



        if (typeof req.app.checkPathOnRequest == 'function') {

            /**
             * If the method exists on application use it to verify the path validity
             * this method can use ctrl.accessDenied to output an error message in outcome
             * and the return false to cancel the controller defaut action
             */
            if (!req.app.checkPathOnRequest(ctrl)) {
                return Q.fcall(function () {
                    throw new Error("Access denied");
                });
            }
        }


        /**
         * Declare a new method to get the service object
         * @param {string} path          relative path from the services folder
         * @param {object} forceParams   Parameters given to service (cannot be overloaded with query params)
         * @return {apiService}
         */
        ctrl.service = function(path, forceParams) {
            var srv = require('./service').load(ctrl.req.app, path);

            ctrl.forcedParameters = forceParams;

            return srv;
        };

        deferred.resolve(ctrl.controllerAction());

        return deferred.promise;
    };


    /**
     * Return on object with parameters to give to the service
     * this method merge the client parameters and the forced server parameters
     *
     * @param {http.IncomingMessage} request
     *
     * @return {Promise}
     */
    this.getServiceParameters = function(request) {

        var name;
        var params = {};


        if (request.query) {
            for(name in request.query) {
                if (request.query.hasOwnProperty(name)) {

                    if (ctrl.ignoreEmptyParams && '' === request.query[name]) {
                        continue;
                    }

                    params[name] = request.query[name];
                }
            }
        }


        if (request.params) {

            // route path parameters

            for(name in request.params) {
                if (request.params.hasOwnProperty(name)) {

                    if (ctrl.ignoreEmptyParams && '' === request.params[name]) {
                        continue;
                    }

                    params[name] = request.params[name];
                }
            }
        }

        if (request.body) {

            // posted body in json format

            for(name in request.body) {
                if (request.body.hasOwnProperty(name)) {

                    if (ctrl.ignoreEmptyParams && '' === request.params[name]) {
                        continue;
                    }

                    params[name] = request.body[name];
                }
            }
        }


        for(name in this.forcedParameters) {
            if (this.forcedParameters.hasOwnProperty(name)) {
                params[name] = this.forcedParameters[name];
            }
        }

        return params;
    };


    /**
     * Output a 500 http code
     * Emit wokflow exception with message
     * @param {String} message
     *
     */
    ctrl.error = function(message) {
         ctrl.workflow.httpstatus = 500;
         ctrl.workflow.emit('exception', message);
    };


    /**
     * Output a 401 http code
     * Emit wokflow exception with message
     * @param {String} message
     *
     */
    ctrl.accessDenied = function(message) {
         ctrl.workflow.httpstatus = 401;
         ctrl.workflow.emit('exception', message);
    };

    /**
     * Output a 404 http code
     * Emit wokflow exception with message
     * @param {String} message
     *
     */
    this.notFound = function(message) {
         ctrl.workflow.httpstatus = 404;
         ctrl.workflow.emit('exception', message);
    };

    /**
     * Add the controller route the app
     * @param {Object} app
     */
    this.addRoute = function(app) {
        app[ctrl.method](ctrl.path, ctrl.onRequest);
    };

    /**
     * Controller use this method to output a service as a rest
     * service
     *
     * @param {apiService} service
     */
    this.jsonService = function(service) {
        throw new Error('not implemented');
    };

    /**
     * Output result as JSON string in controller response and end the response
     * if the promise fail, output the service.outcome object witch is supposed to contrain the error
     *
     * @param {apiService} service
     * @param {Promise}    promise The result promise from apiService.getResultPromise
     */
    this.outputJsonFromPromise = function(service, promise) {

        ctrl.res.setHeader("Content-Type", "application/json");

        promise.then(function(result) {
            ctrl.res.statusCode = service.httpstatus;
            ctrl.res.end(JSON.stringify(result));

        }).catch(function(err) {
            ctrl.res.statusCode = service.httpstatus;
            ctrl.res.end(JSON.stringify({ $outcome: service.outcome }));
        });

    };
}


/**
 * GET request with optional parameters as filters
 * output json with the requested items
 *
 * @param {String} path
 */
function listItemsController(path) {
    restController.call(this, 'get', path);

    var ctrl = this;

    /**
     * Ignore empty by default on list controller
     * because parameters are most likly for search
     */
    ctrl.ignoreEmptyParams = true;

    /**
     * Method to paginate a mongoose query
     * @param {Integer} total
     * @param {Query} query
     * @param {Integer} [itemsPerPage=50]
     *
     * @return {Query}
     */
    this.paginate = function(total, query, itemsPerPage) {


        var paginate = require('node-paginate-anything');
        var p = paginate(ctrl.req, ctrl.res, total, itemsPerPage || 50);

        if (!p) {
            return query;
        }

        query.limit(p.limit);
        query.skip(p.skip);

        return query;
    };


    /**
     * List controller use this method to output a service as a rest
     * service
     *
     * This default method is paginated
     *
     * @param {apiService} service
     *
     * @return {Promise}
     */
    this.jsonService = function(service) {

        var params = ctrl.getServiceParameters(ctrl.req);

        var promise = service.getResultPromise(params, ctrl.paginate);

        ctrl.outputJsonFromPromise(service, promise);

        return promise;
    };
}

listItemsController.prototype = new restController();


/**
 * GET request with an id
 * output json with item data
 *
 * @param {String} path
 */
function getItemController(path) {
    restController.call(this, 'get', path);
    var ctrl = this;

    /**
     * Get item controller use this method to output a service as a rest
     * service
     * Output the document with the $outcome property
     *
     * @param {apiService} service
     *
     * @return {Promise}
     */
    this.jsonService = function(service) {

        var params = ctrl.getServiceParameters(ctrl.req);

        var promise = service.getResultPromise(params);

        ctrl.outputJsonFromPromise(service, promise);

        return promise;
    };
}

getItemController.prototype = new restController();


/**
 * Base class for create or update an item
 *
 * @param {string} method   post|put
 * @param {string} path
 *
 *
 */
function saveItemController(method, path) {
    restController.call(this, method, path);
    var ctrl = this;

    /**
     * Save item controller use this method to output a service as a rest
     * service
     * Output the saved document with the $outcome property
     *
     * @param {apiService} service
     * @param {object} [moreparams] optional additional parameters to give to the service
     *
     * @return {Promise}
     */
    this.jsonService = function(service, moreparams) {

        var params = ctrl.getServiceParameters(ctrl.req);

        var promise = service.getResultPromise(params);

        ctrl.outputJsonFromPromise(service, promise);

        return promise;
    };
}

saveItemController.prototype = new restController();


/**
 * POST request
 * input json of the object to save
 * output json with the saved item data and outcome informations
 *
 * @param {String} path
 */
function createItemController(path) {
    saveItemController.call(this, 'post', path);
}

createItemController.prototype = new saveItemController();


/**
 * PUT request with an id
 * input json of the object to save
 * output json with the saved item data and outcome informations
 *
 * @param {String} path
 */
function updateItemController(path) {
    saveItemController.call(this, 'put', path);
}

updateItemController.prototype = new saveItemController();


/**
 * DELETE request with an id
 * output json with the deleted item data and outcome informations
 *
 * @param {String} path
 */
function deleteItemController(path) {
    restController.call(this, 'delete', path);
    var ctrl = this;

    /**
     * Delete controller use this method to output a service as a rest
     * service
     * Output the deleted document with the $outcome property
     *
     * @param {apiService} service
     *
     * @return {Promise}
     */
    this.jsonService = function(service) {

        var params = ctrl.getServiceParameters(ctrl.req);

        var promise = service.getResultPromise(params);

        ctrl.outputJsonFromPromise(service, promise);

        return promise;
    };
}

deleteItemController.prototype = new restController();



exports = module.exports = {
    list: listItemsController,
    get: getItemController,
    create: createItemController,
    update: updateItemController,
    delete: deleteItemController
};
