'use strict';

const ctrlFactory = require('restitute').controller;

/**
 * Download export file
 *
 * rest service parameters are:
 *  format xlsx|sage|csv...
 *  type balance|requests
 *  from
 *  to
 *  moment
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/admin/export');
    var ctrl = this;

    ctrl.controllerAction = function() {
        let service = ctrl.service('admin/exports/get');
        let params = ctrl.getServiceParameters(ctrl.req);
        let promise = service.getResultPromise(params);

        promise.then(tmpname => {
            ctrl.res.download(tmpname, 'export.xlsx', function() {
                const fs = require('fs');

                fs.unlink(tmpname, (err) => {
                    if (err) {
                        throw err;
                    }
                });
            });
        });
    };
}
getController.prototype = new ctrlFactory.get();



exports = module.exports = {
    get: getController
};
