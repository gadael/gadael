'use strict';

const ctrlFactory = require('restitute').controller;
const fs = require('fs');

/**
 * Download export file
 *
 * rest service parameters are:
 *  format xlsx|sage|csv...
 *  type balance|requests|lunchs
 *  from
 *  to
 *  moment
 *  month
 */
function getController() {
    ctrlFactory.get.call(this, '/rest/admin/export');
    var ctrl = this;

    ctrl.controllerAction = function() {

        let service = ctrl.service('admin/exports/get');
        let params = ctrl.getServiceParameters(ctrl.req);
        let promise = service.getResultPromise(params);

        function deleteTmpfile(tmpname) {
            fs.unlink(tmpname, (err) => {
                if (err) {
                    throw err;
                }
            });
        }

        promise.then(tmpname => {

            if ('sage' === params.type) {
                ctrl.res.download(tmpname, 'export.sage', function() {
                    deleteTmpfile(tmpname);
                });
                return;
            }

            ctrl.res.download(tmpname, 'export.xlsx', function() {
                deleteTmpfile(tmpname);
            });
        });

        // if service fail errors are reported in json
        promise.catch(() => {
            ctrl.outputJsonFromPromise(service, promise);
        });
    };
}
getController.prototype = new ctrlFactory.get();

exports = module.exports = [getController];
