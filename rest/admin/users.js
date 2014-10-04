'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/users'),
    get: new ctrlFactory.get('/rest/admin/users/:id'),
    create: new ctrlFactory.create('/rest/admin/users'),
    update: new ctrlFactory.update('/rest/admin/users/:id'),
    delete: new ctrlFactory.delete('/rest/admin/users/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/users/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/users/get'));
};

function save() {
    this.jsonService(this.service('admin/users/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/users/delete'));
};
