'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/types'),
    get: new ctrlFactory.get('/rest/admin/types/:id'),
    create: new ctrlFactory.create('/rest/admin/types'),
    update: new ctrlFactory.update('/rest/admin/types/:id'),
    delete: new ctrlFactory.delete('/rest/admin/types/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/types/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/types/get'));
};

function save() {
    this.jsonService(this.service('admin/types/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/types/delete'));
};
