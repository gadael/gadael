'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/rights'),
    get: new ctrlFactory.get('/rest/admin/rights/:id'),
    create: new ctrlFactory.create('/rest/admin/rights'),
    update: new ctrlFactory.update('/rest/admin/rights/:id'),
    delete: new ctrlFactory.delete('/rest/admin/rights/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/rights/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/rights/get'));
};

function save() {
    this.jsonService(this.service('admin/rights/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/rights/delete'));
};
