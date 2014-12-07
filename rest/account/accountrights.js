'use strict';

var ctrlFactory = require('../controller');


function listController() {
    ctrlFactory.list.call(this, '/rest/account/calendarevents');
    
    this.controllerAction = function() {
        this.jsonService(this.service('account/accountrights/list', { user: this.req.user._id }));
    };
}
listController.prototype = new ctrlFactory.list();



exports = module.exports = {
    list: listController
};