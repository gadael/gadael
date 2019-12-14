'use strict';
const ctrlFactory = require('restitute').controller;
const paginate = require('node-paginate-anything');

function listController() {
    const ctrl = this;
    ctrlFactory.list.call(this, '/rest/admin/lunchs');

    this.controllerAction = function() {
        this.jsonService(this.service('admin/lunchs/list'));
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

function refreshController() {
    ctrlFactory.create.call(this, '/rest/admin/lunchs');
    this.controllerAction = function() {
        this.jsonService(this.service('admin/lunchs/save'));
    };
}
refreshController.prototype = new ctrlFactory.create();


exports = module.exports = [listController, refreshController];
