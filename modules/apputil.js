'use strict';

/**
 * Add utilities to app or headless app
 * @param {express|object} app
 * 
 */
exports = module.exports = function(app) {
    
    
    //setup utilities
    app.utility = {};
    app.utility.sendmail = require('./sendmail');
    app.utility.slugify = require('./slugify');
    app.utility.workflow = require('./workflow');
    app.utility.gettext = require('./gettext');
    
    /**
     * Load a service
     * 
     * @param {String} path
     *
     * @return {apiService}
     */
    app.service = function(path) {
        var apiservice = require('./service');
        var getService = require('../api/services/'+path);
        return getService(apiservice, app);
    }
};
