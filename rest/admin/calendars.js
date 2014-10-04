'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/calendars'),
    get: new ctrlFactory.get('/rest/admin/calendars/:id'),
    create: new ctrlFactory.create('/rest/admin/calendars'),
    update: new ctrlFactory.update('/rest/admin/calendars/:id'),
    delete: new ctrlFactory.delete('/rest/admin/calendars/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/calendars/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/calendars/get'));
};

function save() {
    this.jsonService(this.service('admin/calendars/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/calendars/delete'));
};
