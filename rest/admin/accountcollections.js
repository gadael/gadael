'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/accountcollections'),
    get: new ctrlFactory.get('/rest/admin/accountcollections/:id'),
    create: new ctrlFactory.create('/rest/admin/accountcollections'),
    update: new ctrlFactory.update('/rest/admin/accountcollections/:id'),
    delete: new ctrlFactory.delete('/rest/admin/accountcollections/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/get'));
};

function save() {
    this.jsonService(this.service('admin/accountcollections/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/accountcollections/delete'));
};
