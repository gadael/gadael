'use strict';


/**
 * Base class for a controller
 *
 * @constructor
 * 
 * @param {string} method         HTTP request method
 * @param {string} path           route path
 */
function restController(method, path) {
    this.method = method;
    this.path = path;
    this.controllerAction = null;
    
    var ctrl = this;
    
    
    /**
     * Method called when the controller route path is fired by the app
     * the controllerAction() method will be called at the end
     * to process the controller specific action
     * 
     * @param {Request} req
     * @param {Response} res
     */
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
         * @return {function}
         */
        ctrl.service = function(path) {
            return require('../modules/service').load(ctrl.req.app, path);
        };
        
        ctrl.controllerAction();
    };
    
    
    /**
     * Output a 401 http code
     * Emit wokflow exception with message
     * @param {String} message
     *
     */
    this.accessDenied = function(message) {
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
            ctrl.workflow.emit('exception', 'Pagination failed');
            return query; // 416
        }
        
        query.limit(p.limit);
        query.skip(p.skip);

        return query;
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
}

getItemController.prototype = new restController();


/**
 * POST request
 * input json of the object to save
 * output json with the saved item data and outcome informations
 *
 * @param {String} path
 */
function createItemController(path) {
    restController.call(this, 'post', path);
}

createItemController.prototype = new restController();


/**
 * PUT request with an id
 * input json of the object to save
 * output json with the saved item data and outcome informations
 *
 * @param {String} path
 */
function updateItemController(path) {
    restController.call(this, 'put', path);
}

updateItemController.prototype = new restController();


/**
 * DELETE request with an id
 * output json with the deleted item data and outcome informations
 *
 * @param {String} path
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
