'use strict';

var ctrlFactory = require('../controller');


function listController() {
    ctrlFactory.list.call(this, '/rest/admin/calendarevents');
    
    this.controllerAction = function() {
        this.jsonService(this.service('admin/calendarevents/list'));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};