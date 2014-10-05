'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/departments'),
    get: new ctrlFactory.get('/rest/admin/departments/:id'),
    create: new ctrlFactory.create('/rest/admin/departments'),
    update: new ctrlFactory.update('/rest/admin/departments/:id'),
    delete: new ctrlFactory.delete('/rest/admin/departments/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/departments/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/departments/get'));
};

function save() {
    this.jsonService(this.service('admin/departments/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/departments/delete'));
};
