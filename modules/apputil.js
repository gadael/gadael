/**
 * @module apputil
 */

'use strict';

/**
 * Add utilities to app or headless app
 * @param {express|object} app
 *
 */
exports = module.exports = function(app) {

    if (undefined !== app.utility) {
        return;
    }


    //setup utilities
    app.utility = {};
    app.utility.slugify = require('./slugify');
    app.utility.workflow = require('./workflow');
    app.utility.gettext = require('./gettext')(app.config);
    app.utility.dispunits = require('./dispunits')(app);
    app.utility.postpone = require('./postpone')(app.config);

    /**
     * Load a service
     *
     * @param {String} path
     *
     * @return {apiService}
     */
    app.getService = function(path) {
        let apiservice = require('restitute').service;
        let getService = require('../api/services/'+path);
        let service = getService(apiservice, app);

        service.path = path;

        return service;
    };


    /**
     * Check access rights for API calls
     * restitute callback
     */
    app.checkPathOnRequest = function(ctrl) {
        const req = ctrl.req;
        const gt = req.app.utility.gettext;

        const adminResource     = 0 === ctrl.path.indexOf('/rest/admin/') || 0 === ctrl.path.indexOf('/api/admin/');
        const accountResource   = 0 === ctrl.path.indexOf('/rest/account/') || 0 === ctrl.path.indexOf('/api/account/');
        const managerResource   = 0 === ctrl.path.indexOf('/rest/manager/') || 0 === ctrl.path.indexOf('/api/manager/');
        const userResource      = 0 === ctrl.path.indexOf('/rest/user/') || 0 === ctrl.path.indexOf('/api/user/');
        const anonymousResource = 0 === ctrl.path.indexOf('/rest/anonymous/') || 0 === ctrl.path.indexOf('/api/anonymous/');

        if (adminResource && (!req.isAuthenticated() || !req.user.canPlayRoleOf('admin'))) {
            ctrl.accessDenied(gt.gettext('Access denied for non administrators'));
            return false;
        }

        if (accountResource && (!req.isAuthenticated() || !req.user.canPlayRoleOf('account'))) {
            ctrl.accessDenied(gt.gettext('Access denied for users without absences account'));
            return false;
        }

        if (managerResource && (!req.isAuthenticated() || !req.user.canPlayRoleOf('manager'))) {
            ctrl.accessDenied(gt.gettext('Access denied for non managers'));
            return false;
        }

        if (userResource && !req.isAuthenticated()) {
            ctrl.accessDenied(gt.gettext('Access denied for anonymous users'));
            return false;
        }

        if (anonymousResource && req.isAuthenticated()) {
            // Do not use 401 before this redirect to login page
            ctrl.error(gt.gettext('Access denied for logged in users'));
            return false;
        }

        return true;
    };
};
