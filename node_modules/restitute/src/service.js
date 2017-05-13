

/**
 * Service base class
 * Return output usable in a REST service but also usable via js API
 *
 * @constructor
 *
 */
function apiService() {

    'use strict';

    /*jshint validthis: true */

    var service = this;

    /**
     * trace errors to console
     * @var {Boolean}
     */
    this.trace = false;

    /**
     * HTTP status for service
     * will be used only by REST service
     * @var {Number}
     */
    this.httpstatus = 200;

    /**
     * Path used in getService
     * defined withing the function app.getService
     * @var {String}
     */
    this.path = null;


    /**
     * Service outcome
     * contain success boolean
     * a list of alert messages
     * errfor: errors associated to fields
     */
    this.outcome = {
        success: true,
        alert: [],
        errfor: {}
    };

    this.Q = require('q');

    /**
     * Defered service result
     */
    this.deferred = this.Q.defer();

    /**
     * Services instances must implement
     * this method to resolve or reject the service promise
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    this.getResultPromise = function(params) {
        console.log('Not implemented');

        return this.deferred.promise;
    };

    /**
     * Set application
     * @param {Object} app
     */
    this.setApp = function(app) {
        service.app = app;
    };


    /**
     * Add alert to service
     * @param {string} type   One of boostrap alert types (danger|success|info)
     * @param {String|Error} err  Error message or object
     */
    this.addAlert = function(type, err) {

        var alert = { type: type };

        if (err instanceof Error) {
            alert.message = err.name+' : '+err.message;
            alert.stack = err.stack;

        } else if (typeof err === 'string') {
            alert.message = err;
        } else {
            console.error(err);
            throw new Error('Wrong error type, must be a string or Error, got '+(typeof err));
        }

        service.outcome.alert.push(alert);
    };


    /**
     * Get an error object from a mixed value
     * @param   {String|Error} err
     * @returns {Error}
     */
    this.getError = function(err) {
        if (err instanceof Error) {
            return err;
        }

        return new Error(err);
    };



    /**
     *  Reject the service promise with an forbidden status
     * The server understood the request, but is refusing to fulfill it.
     * Authorization will not help and the request SHOULD NOT be repeated.
     * If the request method was not HEAD and the server wishes to make public
     * why the request has not been fulfilled, it SHOULD describe the reason for
     * the refusal in the entity. If the server does not wish to make this
     * information available to the client, the status code 404 (Not Found)
     * can be used instead.
     * @param {String|Error} err
     */
    this.forbidden = function(err) {
        service.httpstatus = 403;
        service.outcome.success = false;
        service.addAlert('danger', err);

        service.deferred.reject(service.getError(err));
    };


    /**
     * Reject the service promise with an error status
     * The HTTP server encountered an unexpected condition which prevented
     * it from fulfilling the request.
     * For example this error can be caused by a serveur misconfiguration,
     * or a resource exhausted or denied to the server on the host machine.
     *
     * @param {String|Error} err
     */
    this.error = function(err) {

        if (err.name === 'ValidationError') {
            return service.handleMongoError(err); // 400
        }

        service.httpstatus = 500;
        service.outcome.success = false;
        service.addAlert('danger', err);

        service.deferred.reject(service.getError(err));
    };


    /**
     * Ouput a 404 error
     * with an outcome message
     *
     * @param {String|Error} err
     */
    this.notFound = function(err) {
        service.httpstatus = 404;
        service.outcome.success = false;

        service.addAlert('danger', err);

        service.deferred.reject(service.getError(err));
    };


    /**
     * Ouput a 410 error
     * with an outcome message
     *
     * @param {String|Error} err
     */
    this.gone = function(err) {
        service.httpstatus = 410;
        service.outcome.success = false;

        service.addAlert('danger', err);

        service.deferred.reject(service.getError(err));
    };


    /**
     * Set a success message into outcome
     * @param {String} message
     */
    this.success = function(message) {

        service.addAlert('success', message);

    };


    /**
     * output document and $outcome with a sucess message
     *
     * @param {Document} document           Mongoose document
     * @param {String} message              message for outcome
     */
    this.resolveSuccess = function(document, message) {

        service.outcome.success = true;
        service.success(message);

        var output;
        if (document.toObject) {
            output = document.toObject();
        } else {
            output = document;
        }
        output.$outcome = service.outcome;

        service.deferred.resolve(output);
    };


    /**
     * Get a document using the sibling get service
     * @param {String} param all parameters or document ID to get, this will set the 'id' param in the parameters given to GET service
     * @return {Promise} promise resolve to an object but without the $outcome property
     */
    this.get = function(param) {
        if (null === service.path) {
            throw new Error('The path need to be defined in the app.getService function');
        }

        var path = service.path.split('/');
        delete path[path.length-1];

        if (typeof param !== 'object' || param.constructor.name === 'ObjectID') {
            param = { id: param };
        }

        return service.app.getService(path.join('/')+'/get')
        .getResultPromise(param)
        .then(function(serviceObject) {
            delete serviceObject.$outcome;
            return serviceObject;
        });
    };


    /**
     * output document from the sibling get service and $outcome with a sucess message
     * @param {String} param       savedDocument ID or parameters
     * @param {String} message  message for outcome
     */
    this.resolveSuccessGet = function(param, message) {

        this.get(param).then(function(document) {
            service.resolveSuccess(document, message);
        })
        .catch(service.error);
    };


    /**
     * emit exception if parameter contain a mongoose error
     *
     * @param {Error|null} err - a mongoose error or no error
     * @param {Boolean} trace   set to false to disable console.trace of the error
     *
     * @return {Boolean}
     */
    this.handleMongoError = function(err) {
        if (err) {

            if (true === service.trace) {
                console.trace(err);
            }

            service.httpstatus = 400; // Bad Request

            if (err.errors) {
              for(var field in err.errors) {
                  var e = err.errors[field];
                  service.outcome.errfor[field] = e.type;
                  service.outcome.alert.push({ type:'danger' ,message: e.message});
              }
            }

            service.outcome.alert.push({ type:'danger' ,message: err.message});
            service.outcome.success = false;

            service.deferred.reject(new Error(err.message));
            return false;
        }

        return true;
    };



    /**
     * @return {Boolean}
     */
    this.hasErrors = function() {

        if (Object.keys(service.outcome.errfor).length !== 0) {
            return true;
        }

        for(var i=0; i<service.outcome.alert.length; i++) {
            if (service.outcome.alert[i].type === 'danger') {
                return true;
            }
        }

        return false;
    };


}


/**
 * Service to get a list of items
 * output a resultset
 *
 */
function listItemsService(app) {
    apiService.call(this);
    this.setApp(app);


    var service = this;


    /**
     * Default function used to resolve a result set
     *
     * @param {Error} err   mongoose error
     * @param {Array} docs  an array of mongoose documents or an array of objects
     */
    this.mongOutcome = function(err, docs) {
        if (service.handleMongoError(err))
        {
            service.outcome.success = true;
            service.deferred.resolve(docs);
        }
    };


    /**
     * Resolve a mongoose query, paginated or not
     * This method can be used by the service to resolve a mongoose query
     * The paginate parameter is optional, if not provided, all documents will be resolved to the service promise.
     * the function to use for pagination is the 2nd argument of the getResultPromise() method
     * @see listItemsService.getResultPromise()
     *
     * @param {Query}       find
     * @param {function}    [paginate]      (controller optional function to paginate result)
     * @param {function}    [mongOutcome]   optional function to customise resultset before resolving
     */
    this.resolveQuery = function(find, paginate, mongOutcome) {

        if (!mongOutcome) {
            mongOutcome = this.mongOutcome;
        }

        find.exec(function(err, docs) {
            if (!err && typeof paginate === 'function') {
                return paginate(docs.length, find).exec(mongOutcome);
            }

            return mongOutcome(err, docs);
        });
    };


    /**
     * Services instances must implement
     * this method to resolve or reject the service promise
     * list items services have an additional parameter "paginate", this function will be given as parameter
     * by the controller
     *
     * @see listItemsController.paginate()
     *
     * @param {Object} params
     * @param {function} paginate
     *
     * @return {Promise}
     */
    this.getResultPromise = function(params, paginate) {
        console.log('Not implemented');
        return this.deferred.promise;
    };
}

listItemsService.prototype = new apiService();




/**
 * Service to get one item
 * output one object
 * @constructor
 *
 * @param {Object} app
 */
function getItemService(app) {
    apiService.call(this);
    this.setApp(app);
}

getItemService.prototype = new apiService();





/**
 * Service to create or update one item
 * output the saved object
 * @constructor
 *
 * @param {Object} app
 */
function saveItemService(app) {
    apiService.call(this);
    this.setApp(app);

    var service = this;

    /**
     * Test required fields in params
     * complete outcome and http status if a fields is empty
     *
     * @param {Object} params - parameters to save
     * @param {Array} list - list of fields to test
     *
     * @return {bool}
     */
    service.needRequiredFields = function(params, list) {

        for(var i=0; i<list.length; i++)
        {
            if (!params[list[i]]) {
                service.outcome.errfor[list[i]] = 'required';
                service.httpstatus = 400; // Bad Request
                service.outcome.success = false;
            }
        }

        if (service.hasErrors()) {
            service.deferred.reject(new Error('Missing mandatory fields'));
            return true;
        }

        return false;
    };
}

saveItemService.prototype = new apiService();


/**
 * Service to delete one item
 * output the deleted object
 * @constructor
 *
 * @param {Object} app
 */
function deleteItemService(app) {
    apiService.call(this);
    this.setApp(app);
}

deleteItemService.prototype = new apiService();




/**
 * Load a service object
 * @param {express|Object} app      Express app or headless app
 * @param {String} path
 *
 * @return {apiService}
 */
function loader(app, path) {
    return app.getService(path);
}




exports = module.exports = {
    list: listItemsService,
    get: getItemService,
    save: saveItemService,
    delete: deleteItemService,
    load: loader
};
