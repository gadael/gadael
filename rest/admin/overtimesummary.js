'use strict';
const ctrlFactory = require('restitute').controller;
const paginate = require('node-paginate-anything');

function listController() {
    const ctrl = this;
    ctrlFactory.list.call(this, '/rest/admin/overtimesummary');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/overtimesummary/list'));
    };

    /**
     * Custom pagination for aggregation query
     * @param {Integer} total
     * @param {Query} agregation
     * @param {Integer} [itemsPerPage=50]
     *
     * @return {Query}
     */
    this.paginate = function(total, agregation, itemsPerPage) {
        var p = paginate(ctrl.req, ctrl.res, total, itemsPerPage || 50);
        if (!p) {
            return agregation;
        }

        agregation.skip(p.skip);
        agregation.limit(p.limit);
        return agregation;
    };
}
listController.prototype = new ctrlFactory.list();

function convertController() {
    ctrlFactory.create.call(this, '/rest/admin/overtimesummary');
    this.controllerAction = function() {
        this.jsonService(this.service('admin/overtimesummary/save'));
    };
}
convertController.prototype = new ctrlFactory.create();


exports = module.exports = [listController, convertController];
