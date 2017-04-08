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


    app.checkPathOnRequest = function(ctrl) {

        var req = ctrl.req;

        var gt = req.app.utility.gettext;

        if (0 === ctrl.path.indexOf('/rest/admin/') && (!req.isAuthenticated() || !req.user.canPlayRoleOf('admin'))) {
            ctrl.accessDenied(gt.gettext('Access denied for non administrators'));
            return false;
        }

        if (0 === ctrl.path.indexOf('/rest/account/') && (!req.isAuthenticated() || !req.user.canPlayRoleOf('account'))) {
            ctrl.accessDenied(gt.gettext('Access denied for users without absences account'));
            return false;
        }

        if (0 === ctrl.path.indexOf('/rest/manager/') && (!req.isAuthenticated() || !req.user.canPlayRoleOf('manager'))) {
            ctrl.accessDenied(gt.gettext('Access denied for non managers'));
            return false;
        }

        if (0 === ctrl.path.indexOf('/rest/user/') && !req.isAuthenticated()) {
            ctrl.accessDenied(gt.gettext('Access denied for anonymous users'));
            return false;
        }

        if (0 === ctrl.path.indexOf('/rest/anonymous/') && req.isAuthenticated()) {
            // Do not use 401 before this redirect to login page
            ctrl.error(gt.gettext('Access denied for logged in users'));
            return false;
        }

        return true;
    };
};
