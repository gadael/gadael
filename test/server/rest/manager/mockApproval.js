'use strict';



/**
 * The mock approval object
 * @param {mockServer} server
 * @param {Function} readyCallback
 */
function mockApproval(server, readyCallback) {

    var apiPath = '../../../../api/';

    this.api = {
        user: require(apiPath+'User.api.js')
    };
    this.Q = require('q');
    this.server = server;
}

mockApproval.prototype.createRight = function(name, quantity, quantity_unit) {
    var deferred = this.Q.defer();
    var RightModel = this.server.app.db.mongoose.model('Right');
    var right = new RightModel();
    right.name = name;
    right.quantity = quantity;
    right.quantity_unit = quantity_unit;
    return right.save();
};

mockApproval.prototype.createCollection = function(name) {

};


mockApproval.prototype.createDepartment = function(name, parent) {

};



exports = module.exports = mockApproval;
