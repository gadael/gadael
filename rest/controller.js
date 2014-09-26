'use strict';


/**
 * Base class for a controller
 * 
 * @param string method         HTTP request method
 * @param string path           route path
 */
function restController(method, path) {
    this.method = method;
    this.path = path;
    this.controllerAction = null;
    
    var ctrl = this;
    
    
    
    this.onRequest = function(req, res) {
        ctrl.req = req;
        ctrl.res = res;
        ctrl.workflow = req.app.utility.workflow(req, res);
        ctrl.models = req.app.db.models;
        
        var gt = req.app.utility.gettext;

        if (0 === ctrl.path.indexOf('/rest/admin/') && (!req.isAuthenticated() || !req.user.canPlayRoleOf('admin'))) {
            ctrl.accessDenied(gt.gettext('Access denied for non administrators'));
            return;
        }
        
        /**
         * Declare a new method to get the service object
         * @param string path relative path from the services folder
         * @return function
         */
        ctrl.service = function(path) {
            var getService = require('../api/services/'+path);
            var services = require('../modules/service');
            return getService(services, ctrl.req.app);
        };
        
        ctrl.controllerAction();
    };
    
    
    this.accessDenied = function(message) {
         ctrl.workflow.httpstatus = 401;
         ctrl.workflow.emit('exception', message);
    };
    
    this.notFound = function(message) {
         ctrl.workflow.httpstatus = 404;
         ctrl.workflow.emit('exception', message);
    };
    
    this.addRoute = function(app) {
        app[ctrl.method](ctrl.path, ctrl.onRequest);
    };
}


/**
 * GET request with optional parameters as filters
 * output json with the requested items
 */
function listItemsController(path) {
    restController.call(this, 'get', path);
    
    var ctrl = this;

    /**
     * Method to paginate a find query
     * 
     * @return promise
     */
    this.paginate = function(find, itemsPerPage) {
        
        var Q = require('q');
        var deferred = Q.defer();
        
        find.count(function(err, total) {
            if (ctrl.workflow.handleMongoError(err))
            {
                var paginate = require('node-paginate-anything');
                var p = paginate(ctrl.req, ctrl.res, total, itemsPerPage || 50);
                
                if (!p) {
                    ctrl.workflow.emit('exception', 'Pagination failed');
                    deferred.reject(new Error('Pagination failed'));
                    return; // 416
                }
                
                deferred.resolve(p);
            }
        });
        
        return deferred.promise;
    };
}

listItemsController.prototype = new restController();


/**
 * GET request with an id
 * output json with item data
 */
function getItemController(path) {
    restController.call(this, 'get', path);
}

getItemController.prototype = new restController();


/**
 * POST request
 * input json of the object to save
 * output json with the saved item data and outcome informations
 */
function createItemController(path) {
    restController.call(this, 'post', path);
}

createItemController.prototype = new restController();


/**
 * PUT request with an id
 * input json of the object to save
 * output json with the saved item data and outcome informations
 */
function updateItemController(path) {
    restController.call(this, 'put', path);
}

updateItemController.prototype = new restController();


/**
 * DELETE request with an id
 * output json with the deleted item data and outcome informations
 */
function deleteItemController(path) {
    restController.call(this, 'delete', path);
}

deleteItemController.prototype = new restController();



exports = module.exports = {
    list: listItemsController,
    get: getItemController,
    create: createItemController,
    update: updateItemController,
    delete: deleteItemController
};
