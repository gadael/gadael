'use strict';

var ctrlFactory = require('../controller');


exports = module.exports = {
    list: new ctrlFactory.list('/rest/admin/accountschedulecalendars'),
    get: new ctrlFactory.get('/rest/admin/accountschedulecalendars/:id'),
    create: new ctrlFactory.create('/rest/admin/accountschedulecalendars'),
    update: new ctrlFactory.update('/rest/admin/accountschedulecalendars/:id'),
    delete: new ctrlFactory.delete('/rest/admin/accountschedulecalendars/:id')
};

exports.list.controllerAction = function() {
    this.jsonService(this.service('admin/accountschedulecalendars/list'));
};

exports.get.controllerAction = function() {
    this.jsonService(this.service('admin/accountschedulecalendars/get'));
};

function save() {
    this.jsonService(this.service('admin/accountschedulecalendars/save'));
}

exports.create.controllerAction = save;
exports.update.controllerAction = save;

exports.delete.controllerAction = function() {
    this.jsonService(this.service('admin/accountschedulecalendars/delete'));
};
