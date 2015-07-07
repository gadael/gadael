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


/**
 * Create a right
 */
mockApproval.prototype.createRight = function(name, quantity, quantity_unit) {

    var RightModel = this.server.app.db.mongoose.model('Right');
    var right = new RightModel();
    right.name = name;
    right.quantity = quantity;
    right.quantity_unit = quantity_unit;
    return right.save();
};


/**
 * Create a right collection
 * with 4 rights
 *
 * @return {Promise}
 */
mockApproval.prototype.createCollection = function(name) {

    var deferred = this.Q.defer();
    var self = this;
    var RightCollectionModel = this.server.app.db.mongoose.model('RightCollection');
    var collection = new RightCollectionModel();
    collection.name = name;
    collection.save(function(err, collection) {
        var promises = [];
        promises.push(self.createRight('right 1', 25, 'D'));
        promises.push(self.createRight('right 2', 5.25, 'D'));
        promises.push(self.createRight('right 3', 2, 'D'));
        promises.push(self.createRight('right 4', 100, 'H'));

        Q.All(promises).then(function(rights) {

            //TODO add beneficiaries
            deferred.resolve(collection);
        });
    });

    return deferred.promise;
};







/**
 * Create a departments tree to mock approval
 * @todo: make non-linear
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

    // prepare parents by index

    var position = [
        null,   // d0
        0,      // d1
        0,      // d2
        1,      // d3
        2,      // d4
        2,      // d5
        4,      // d6
        4       // d7
    ];

    // create 7 departments

    var departments = [], parent = null, count = 0, api = this.api;

    function nextCreation(department) {

        api.user.createRandomManager(app).then(function(randomManager) {



            if (randomManager.user.roles.manager === undefined) {
                return deferred.reject('Not a manager');
            }


            randomManager.user.populate('roles.manager', function() {

                randomManager.user.roles.manager.department.push(department._id);
                randomManager.user.roles.manager.save(function() {

                    departments.push(department);
                    count++;

                    parent = departments[position[count]];


                    if (count <= 7) {
                        return api.department.create(app, parent).then(nextCreation);
                    }

                    deferred.resolve(departments);

                });
            });


        }, deferred.reject);
    }


    api.department.create(app, parent).then(nextCreation);

    return deferred.promise;

};



exports = module.exports = mockApproval;
