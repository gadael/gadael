'use strict';



/**
 * The mock approval object
 * @param {mockServer} server
 * @param {Function} readyCallback
 */
function mockApproval(server, readyCallback) {

    var apiPath = '../../../../api/';

    this.api = {
        user: require(apiPath+'User.api.js'),
        department: require(apiPath+'Department.api.js')
    };
    this.Q = require('q');
    this.server = server;
}

mockApproval.prototype.createRight = function(name, quantity, quantity_unit) {

    var RightModel = this.server.app.db.mongoose.model('Right');
    var right = new RightModel();
    right.name = name;
    right.quantity = quantity;
    right.quantity_unit = quantity_unit;
    return right.save();
};

mockApproval.prototype.createCollection = function(name) {

    var RightCollectionModel = this.server.app.db.mongoose.model('RightCollection');
    var collection = new RightCollectionModel();
    collection.name = name;
    return collection.save();
};


/**
 * Create a departments tree to mock approval
 *
 *   d0
 *   /\
 * d1  d2
 *  |  | \
 * d3 d4  d5
 *   /  \
 *  d6  d7
 */
mockApproval.prototype.createDepartments = function(app) {

    var deferred = this.Q.defer();

    // create 7 departments

    var departments = [], parent = null, count = 7, api = this.api.department;

    function nextCreation(department) {

        departments.push(department);
        parent = department._id;
        count--;

        if (count > 0) {
            return api.create(app, parent).then(nextCreation);
        }

        deferred.resolve(departments);
    }


    api.create(app, parent).then(nextCreation);

    return deferred.promise;

};



exports = module.exports = mockApproval;
