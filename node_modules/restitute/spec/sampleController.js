
var restitute = require('../src/index');


// Simple controllers

function listTestController() {

    restitute.controller.list.call(this, '/rest/listTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('list'));
    };
}
listTestController.prototype = new restitute.controller.list();


function listTestWithEmptyController() {

    restitute.controller.list.call(this, '/rest/listTestWithEmptyController');

    this.ignoreEmptyParams = false;
    this.controllerAction = function() {
        return this.jsonService(this.service('list'));
    };
}
listTestWithEmptyController.prototype = new restitute.controller.list();




function getTestController() {

    restitute.controller.get.call(this, '/rest/getTestController/:id');

    this.controllerAction = function() {
        return this.jsonService(this.service('get'));
    };
}
getTestController.prototype = new restitute.controller.get();




function deleteTestController() {

    restitute.controller.delete.call(this, '/rest/deleteTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('delete'));
    };
}
deleteTestController.prototype = new restitute.controller.delete();




function createTestController() {

    restitute.controller.create.call(this, '/rest/createTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('save'));
    };
}
createTestController.prototype = new restitute.controller.create();


function updateTestController() {
    restitute.controller.update.call(this, '/rest/updateTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('save'));
    };
}
updateTestController.prototype = new restitute.controller.update();


// controllers with orverwritten parameter



function listParamTestController() {
    restitute.controller.list.call(this, '/rest/listParamTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('list', { readonly: 1 }));
    };
}
listParamTestController.prototype = new restitute.controller.list();



function getParamTestController() {
    restitute.controller.get.call(this, '/rest/getParamTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('get', { readonly: 1 }));
    };
}
getParamTestController.prototype = new restitute.controller.get();




function deleteParamTestController() {
    restitute.controller.delete.call(this, '/rest/deleteParamTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('delete', { readonly: 1 }));
    };
}
deleteParamTestController.prototype = new restitute.controller.delete();




function createParamTestController() {
    restitute.controller.create.call(this, '/rest/createParamTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('save', { readonly: 1 }));
    };
}
createParamTestController.prototype = new restitute.controller.create();


function updateParamTestController() {
    restitute.controller.update.call(this, '/rest/updateParamTestController');

    this.controllerAction = function() {
        return this.jsonService(this.service('save', { readonly: 1 }));
    };
}
updateParamTestController.prototype = new restitute.controller.update();








exports = module.exports = {
    list: listTestController,
    listEmpty: listTestWithEmptyController,
    get: getTestController,
    delete: deleteTestController,
    create: createTestController,
    update: updateTestController,

    listParam: listParamTestController,
    getParam: getParamTestController,
    deleteParam: deleteParamTestController,
    createParam: createParamTestController,
    updateParam: updateParamTestController
};
