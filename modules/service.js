'use strict';

/**
 * Service base class
 * Return output usable in a REST service but also usable via js API
 *
 * @constructor
 * 
 */
function apiService() {
    
    var service = this;
    
    /**
     * HTTP status for service
     * will be used only by REST service
     */
    this.httpstatus = 200;
    

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
     * this method
     */
    this.call = function() {
        console.log('Not implemented');   
    }
    
    /**
     * Set application
     * @param {Object} app
     */
    this.setApp = function(app) {
        /**
         * Shortcut for gettext utility
         */
        this.gt = app.utility.gettext;
        
        /**
         * Shortcut for db models
         */
        this.models = app.db.models;
    }
    
    
    /**
     * Ouput a 404 error
     * with an outcome message
     * 
     * @param {String} message
     */
    this.notFound = function(message) {
         service.httpstatus = 404;
         service.outcome.success = false;
         service.outcome.alert.push({ type:'danger' ,message: message});
         
         service.deferred.reject(new Error(message));
    };
    
    
    /**
     * emit exception if parameter contain a mongoose error
     *
     * @param {Error|null} err - a mongoose error or no error
     *
     * @return {Boolean}
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
    
    
};


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
     * Resolve a mongoose query, paginated or not
     * @param query find
     * @param string cols
     * @param string sortkey
     * @param function [paginate] (controller optional function to paginate result)
     */
    this.resolveQuery = function(find, cols, sortkey, paginate) {
        

        var mongOutcome = function(err, docs) {
            if (service.handleMongoError(err))
            {
                service.outcome.success = true;
                service.deferred.resolve(docs);
            }
        };
        
        
        var q = find.select(cols).sort(sortkey);
        q.exec(function(err, docs) {
            if (null !== paginate) {
                return paginate(docs.length, q).exec(mongOutcome);
            }
            
            return mongOutcome(err, docs);
        });
    }
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

        return service.hasErrors();
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



exports = module.exports = {
    list: listItemsService,
    get: getItemService,
    save: saveItemService,
    delete: deleteItemService
};
