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
    
    this.addRoute = function(app) {
        app[this.method](this.path, this.controllerAction);
    }
}


/**
 * GET request with optional parameters as filters
 * output json with the requested items
 */
function listItemsController(path) {
    restController.call(this, 'GET', path);
}

listItemsController.prototype = new restController;


/**
 * GET request with an id
 * output json with item data
 */
function getItemController(path) {
    restController.call(this, 'GET', path);
}

getItemController.prototype = new restController;


/**
 * POST request
 * input json of the object to save
 * output json with the saved item data and outcome informations
 */
function createItemController(path) {
    restController.call(this, 'POST', path);
}

createItemController.prototype = new restController;


/**
 * PUT request with an id
 * input json of the object to save
 * output json with the saved item data and outcome informations
 */
function updateItemController(path) {
    restController.call(this, 'PUT', path);
}

updateItemController.prototype = new restController;


/**
 * DELETE request with an id
 * output json with the deleted item data and outcome informations
 */
function deleteItemController(path) {
    restController.call(this, 'DELETE', path);
}

deleteItemController.prototype = new restController;



exports = module.exports = {
    get: getItemController,
    create: createItemController
    update: updateItemController,
    delete: deleteItemController
}
