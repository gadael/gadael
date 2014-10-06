'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/rightrenewals'),
    get: new ctrlFactory.get('/rest/admin/rightrenewals/:id'),
    create: new ctrlFactory.create('/rest/admin/rightrenewals'),
    update: new ctrlFactory.update('/rest/admin/rightrenewals/:id'),
    delete: new ctrlFactory.delete('/rest/admin/rightrenewals/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/rightrenewals/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/rightrenewals/get'));
};

function save() {
    this.jsonService(this.service('admin/rightrenewals/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/rightrenewals/delete'));
};
