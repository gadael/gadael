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

    this.server = server;


    this.managersByDepartment = {};
    this.accountsByDepartment = {};
}


/**
 * Create a right with a renewal starting one year before today and stopping one year after today
 */
mockApproval.prototype.createRight = function(name, quantity, quantity_unit) {


    var RightModel = this.server.app.db.models.Right;
    var right = new RightModel();
    right.name = name;
    right.quantity = quantity;
    right.quantity_unit = quantity_unit;

    return right.save()
    .then(right => {

        var start = new Date();     start.setFullYear(start.getFullYear()-1);
        var finish = new Date();    finish.setFullYear(finish.getFullYear()+1);

        return right.createRenewal(start, finish)
        .then(() => {
            return right;
        });

    });
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
        return rightPromise
        .then(function(right) {

            var beneficiary = new BeneficiaryModel();
            beneficiary.right = right._id;
            beneficiary.document = collection._id;
            beneficiary.ref = 'RightCollection';
            return beneficiary.save();
        });

    }


    var collection = new RightCollectionModel();
    collection.name = name;

    return collection.save()
    .then(collection => {

        var promises = [];
        promises.push(beneficiary(self.createRight('right 1', 25, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 2', 5.25, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 3', 2, 'D'), collection));
        promises.push(beneficiary(self.createRight('right 4', 100, 'H'), collection));

        return Promise.all(promises).then((beneficiaries) => {
            return collection;
        });
    });
};


/**
 * @param {Department} department
 * @param {Object} account
 */
mockApproval.prototype.addAccount = function(department, account) {

    if (undefined === this.accountsByDepartment[department.name]) {
        this.accountsByDepartment[department.name] = [];
    }

    this.accountsByDepartment[department.name].push(account);
};

/**
 * @param {Department} department
 * @param {Object} manager
 */
mockApproval.prototype.addManager = function(department, manager) {

    if (undefined === this.managersByDepartment[department.name]) {
        this.managersByDepartment[department.name] = [];
    }

    this.managersByDepartment[department.name].push(manager);

};



/**
 * Create a departments tree to mock approval
 * @todo: make non-linear
 *
 *   d0         d0: 1 manager, 1 member
 *   /\
 * d1  d2       d1: 2 managers             d2: 2 members
 *  |  | \
 * d3 d4  d5    d3: 1 manager, 3 members    d4: 2 manager (AND), 1 member     d5: 1 member
 *   /  \
 *  d6  d7      d6: 2 managers (OR), 1 member    d7: 1 member
 */
mockApproval.prototype.createDepartments = function(app) {

    var mockApproval = this;
    var departments = [], parent = null, count = 0, api = this.api;

    var deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    /**
     * Get a promise for n users
     * @param {Int} n
     * @param {String} method on user document
     * @param {populateField} Field to populate after user creation
     * @return {Promise}
     */
    function getUsers(n, method, populateField)
    {
        var usersDeferred = {};
        usersDeferred.promise = new Promise(function(resolve, reject) {
            usersDeferred.resolve = resolve;
            usersDeferred.reject = reject;
        });

        var users = [];


        function next(loop) {

            if (loop <= 0) {
                return usersDeferred.resolve(users);
            }


            api.user[method](app)
            .then(function populate(randomUser) {
                randomUser.user.populate(populateField, function(err, populatedUser) {

                    users.push(randomUser);
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

    var managerOperator = [
        'OR',   // d0
        'OR',   // d1
        'OR',   // d2
        'OR',   // d3
        'AND',  // d4
        'OR',   // d5
        'OR',   // d6
        'OR'    // d7
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


        Promise.all(rolesPromises)
        .then(all => {

            let managers = all[0];
            let accounts = all[1];

            var i;
            var savedDocumentsPromises = []; // Manager & User

            for(i=0; i<managers.length; i++) {
                managers[i].user.roles.manager.department.push(department._id);
                mockApproval.addManager(department, managers[i]);
                savedDocumentsPromises.push(managers[i].user.roles.manager.save());
            }

            for(i=0; i<accounts.length; i++) {
                accounts[i].user.department = department._id;
                mockApproval.addAccount(department, accounts[i]);
                savedDocumentsPromises.push( accounts[i].user.save());
            }


            function end() {
                departments.push(department);
                count++;

                parent = departments[position[count]];


                if (count <= 7) {
                    return api.department.create(app, parent, 'd'+count, managerOperator[count]).then(nextCreation);
                }

                // resolve the main promise once the 7 departments are created
                deferred.resolve(departments);

            }


            if (0 === savedDocumentsPromises.length) {
                return end();
            }

            Promise.all(savedDocumentsPromises).then(end);


        }, deferred.reject);
    }


    api.department.create(app, parent, 'd0', managerOperator[0]).then(nextCreation);

    return deferred.promise;

};

/**
 * Create a random absence request
 * @param   {User} user
 * @returns {Promise} service promise
 */
mockApproval.prototype.createRequest = function createRequest(user)
{
    return this.api.request.createRandomAbsence(this.server.app, user);
};



/**
 * Get requests created by users from one department name
 * @param {String} departmentName       Department name
 * @return {Promise}
 */
mockApproval.prototype.getRequests = function getRequests(departmentName)
{
    var deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    var async = require('async');

    var model = this.server.app.db.models.Department;

    function asyncRequests(user, callback) {

        user.roles.account.getRequests().then(function(requests) {
            callback(null, requests);
        });
    }


    model.findOne({ name: departmentName }, function(err, department) {

        if (err) {
            return deferred.reject(err);
        }

        if (!department) {
            return deferred.reject('No department with name '+departmentName);
        }

        department.getUsers(function(err, users) {

            if (err) {
                deferred.reject(err);
            }

            if (0 === users.length) {
                return deferred.resolve([]);
            }

            async.concat(users, asyncRequests, function(err, requests) {
                if (err) {
                    return deferred.reject(err);
                }
                deferred.resolve(requests);
            });

        });

    });

    return deferred.promise;
};






exports = module.exports = mockApproval;
