'use strict';

/**
 * Service base class
 * Return output usable in a REST service but also usable via js API
 */
function apiService(app) {
    
    var service = this;
    
    /**
     * HTTP status for service
     * will be used only by REST service
     */
    this.httpstatus = 200;
    
    /**
     * Service output
     * array for listItems
     * object for getItem and save and delete
     * @var array | object 
     */
    this.output = null;

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
     * Shortcut for gettext utility
     */
    this.gt = app.utility.gettext;
    
    /**
     * Shortcut for db models
     */
    this.models = app.db.models;
    
    
    this.notFound = function(message) {
         service.httpstatus = 404;
         service.outcome.success = false;
         service.outcome.alert.push({ type:'danger' ,message: message});
         
         service.deferred.reject(new Error(message));
    };
    
    
    /**
     * emit exception if parameter contain a mongoose error
     */  
    this.handleMongoError = function(err) {
        if (err) {
          
            console.trace(err);

            service.httpstatus = 400; // Bad Request

            if (err.errors) {
              for(var field in err.errors) {
                  var e = err.errors[field];
                  service.outcome.errfor[field] = e.type;
                  service.outcome.alert.push({ type:'danger' ,message: e.message});
              }
            }

            service.outcome.alert.push({ type:'danger' ,message: err.message});


            service.deferred.reject(new Error(err.message));
            return false;
        }

        return true;
    };
};


/**
 * Service to get a list of items
 * output a mongoose query in a promise (this query can be paginated afterward by the controller)
 */
function listItemsService(path) {
    apiService.call(this);
}

listItemsService.prototype = new apiService();




/**
 * Service to get one item
 * output one object
 */
function getItemService(app) {
    apiService.call(this, app);
}

getItemService.prototype = new apiService();





/**
 * Service to create or update one item
 * output the saved object
 */
function saveItemService(app) {
    apiService.call(this, app);
}

saveItemService.prototype = new apiService();


/**
 * Service to delete one item
 * output the deleted object
 */
function deleteItemService(app) {
    apiService.call(this, app);
}

deleteItemService.prototype = new apiService();



exports = module.exports = {
    list: listItemsService,
    get: getItemService,
    save: saveItemService,
    delete: deleteItemService
};
