'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/collections'),
    get: new ctrlFactory.get('/rest/admin/collections/:id'),
    create: new ctrlFactory.create('/rest/admin/collections'),
    update: new ctrlFactory.update('/rest/admin/collections/:id'),
    delete: new ctrlFactory.delete('/rest/admin/collections/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/collections/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/collections/get'));
};

function save() {
    this.jsonService(this.service('admin/collections/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/collections/delete'));
};
