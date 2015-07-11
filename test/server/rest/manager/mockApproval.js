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
        department: require(apiPath+'Department.api.js'),
        request: require(apiPath+'Request.api.js')
    };
    this.Q = require('q');
    this.server = server;
}


/**
 * Create a right with a renewal starting one year before today and stopping one year after today
 */
mockApproval.prototype.createRight = function(name, quantity, quantity_unit) {

    var deferred = this.Q.defer();

    var RightModel = this.server.app.db.models.Right;
    var right = new RightModel();
    right.name = name;
    right.quantity = quantity;
    right.quantity_unit = quantity_unit;
    right.save(function(err, right) {

        if (err) {
            return deferred.reject(err);
        }

        var start = new Date();     start.setFullYear(start.getFullYear()-1);
        var finish = new Date();    finish.setFullYear(finish.getFullYear()+1);

        right.createRenewal(start, finish).then(function() {
            deferred.resolve(right);
        }, deferred.reject);

    });


    return deferred.promise;
};




/**
 * Create a right collection
 * with 4 rights
 *
 * @return {Promise}
 */
mockApproval.prototype.createCollection = function(name) {

    var self = this;
    var BeneficiaryModel = this.server.app.db.models.Beneficiary;
    var RightCollectionModel = this.server.app.db.models.RightCollection;


    /**
     * create link from right to collection
     * @return {Promise}
     */
    function beneficiary(rightPromise, collection)
    {

        var deferredBeneficiary = self.Q.defer();
        rightPromise.then(function(right) {

            var beneficiary = new BeneficiaryModel();
            beneficiary.right = right._id;
            beneficiary.document = collection._id;
            beneficiary.ref = 'RightCollection';
            beneficiary.save(function(err, beneficiary) {
                deferredBeneficiary.resolve(beneficiary);
            });


        });

        return deferredBeneficiary.promise;
    }

    var deferred = self.Q.defer();
    var collection = new RightCollectionModel();
    collection.name = name;
    collection.save(function(err, collection) {

        var promises = [];
        promises.push(beneficiary(self.createRight('right 1', 25, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 2', 5.25, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 3', 2, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 4', 100, 'H'), collection));

        self.Q.all(promises).done(function(beneficiaries) {
            deferred.resolve(collection);
        });
    });

    return deferred.promise;
};







/**
 * Create a departments tree to mock approval
 * @todo: make non-linear
 *
 *   d0         d0: 1 manager, 1 member
 *   /\
 * d1  d2       d1: 2 managers             d2: 2 members
 *  |  | \
 * d3 d4  d5    d3: 1 manager, 3 members    d4: 2 manager, 1 member     d5: 1 member
 *   /  \
 *  d6  d7      d6: 2 managers, 1 member    d7: 1 member
 */
mockApproval.prototype.createDepartments = function(app) {

    var departments = [], parent = null, count = 0, api = this.api, Q = this.Q;
    var deferred = this.Q.defer();


    /**
     * Get a promise for n users
     * @param {Int} n
     * @param {String} method on user document
     * @param {populateField} Field to populate after user creation
     * @return {Promise}
     */
    function getUsers(n, method, populateField)
    {
        var usersDeferred = Q.defer();
        var users = [];


        function next(loop) {

            if (loop <= 0) {

                return usersDeferred.resolve(users);
            }


            api.user[method](app).then(function populate(randomUser) {
                randomUser.user.populate(populateField, function(err, populatedUser) {

                    users.push(populatedUser);
                    loop--;
                    next(loop);
                });
            });
        }

        next(n);
        return usersDeferred.promise;
    }




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

    // prepare number of managers by index

    var managerCount = [
        1,      // d0
        2,      // d1
        0,      // d2
        1,      // d3
        2,      // d4
        0,      // d5
        2,      // d6
        0       // d7
    ];

    // prepare number of accounts by index

    var accountCount = [
        1,      // d0
        0,      // d1
        2,      // d2
        3,      // d3
        1,      // d4
        1,      // d5
        1,      // d6
        1       // d7
    ];


    // create 7 departments


    function nextCreation(department) {
        var rolesPromises = [];
        rolesPromises.push(getUsers(managerCount[count], 'createRandomManager', 'roles.manager'));
        rolesPromises.push(getUsers(accountCount[count], 'createRandomAccount', 'roles.account'));


        Q.all(rolesPromises).spread(function(managers, accounts) {

            var i;
            var savedDocumentsPromises = []; // Manager & User

            for(i=0; i<managers.length; i++) {
                managers[i].roles.manager.department.push(department._id);
                savedDocumentsPromises.push(managers[i].roles.manager.save());
            }

            for(i=0; i<accounts.length; i++) {
                accounts[i].department = department._id;
                savedDocumentsPromises.push( accounts[i].save());
            }


            function end() {
                departments.push(department);
                count++;

                parent = departments[position[count]];


                if (count <= 7) {
                    return api.department.create(app, parent).then(nextCreation);
                }

                // resolve the main promise once the 7 departments are created
                deferred.resolve(departments);

            }


            if (0 === savedDocumentsPromises.length) {
                return end();
            }

            Q.all(savedDocumentsPromises).then(end);


        }, deferred.reject);
    }


    api.department.create(app, parent).then(nextCreation);

    return deferred.promise;

};


mockApproval.prototype.createRequest = function createRequest(user)
{
    return this.api.request.createRandomAbsence(this.server.app, user);
};



exports = module.exports = mockApproval;
