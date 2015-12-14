'use strict';


describe('Collaborators', function() {

    /**
     * @var {mockServer}
     */
    var server;

    /**
     * @var {mockApproval}
     */
    var approval;

    var departments1;
    var collection1;

    var requests = [];

    var managersByDepartment;
    var accountsByDepartment;

    var async = require('async');

    /**
     * Callback from async
     */
    function getDepartmentUsers(department, callback) {
        department.getUsers(callback);
    }


    beforeEach(function(done) {
        var mockServerModule = require('../mockServer');
        var mockApproval = require('../manager/mockApproval');

        mockServerModule.mockServer('colaborators', function(_mockServer) {
            server = _mockServer;

            approval = new mockApproval(server);
            done();
        });
    });


    it('verify the mock objects', function(done) {
        expect(server.app).toBeDefined();
        expect(approval).toBeDefined();
        done();
    });


    it('create collection', function(done) {
        approval.createCollection('Test collection').then(function(collection) {
            collection1 = collection;
            collection.getRights().then(function(arr) {
                expect(arr.length).toEqual(4);
                done();
            });
        });
    });


    it('create departments', function(done) {
        approval.createDepartments(server.app).then(function(departments) {
            expect(departments).toBeDefined();
            departments1 = departments;
            departments[7].getAncestors(function(err, ancestors) {
                expect(err).toEqual(null);
                expect(ancestors.length).toEqual(3);
                managersByDepartment = approval.managersByDepartment;
                accountsByDepartment = approval.accountsByDepartment;
                done();
            });
        });
    });



    it('set collection on accounts', function(done) {


        function userSetCollection(user, callback) {

            if (user.roles.account === undefined) {
                return callback();
            }

            user.roles.account.setCollection(collection1).then(function(accountCollection) {
                callback();
            }, callback);

        }

        async.concat(departments1, getDepartmentUsers, function(err, users) {
            async.each(users, userSetCollection, done);
        });

    });


    it('create one request per user in each department', function(done) {

        function userCreateRequest(user, callback) {

            if (user.roles.account === undefined) {
                return callback();
            }

            approval.createRequest(user).then(function(request) {
                requests.push(request);
                callback(undefined, request);
            }).catch(callback);
        }

        async.concat(departments1, getDepartmentUsers, function(err, users) {
            async.each(users, userCreateRequest, done);
        });
    });



    it('Login with the first user from d6', function(done) {
        expect(accountsByDepartment.d6[0].user).toBeDefined();
        server.post('/rest/login', {
            'username': accountsByDepartment.d6[0].user.email,
            'password': accountsByDepartment.d6[0].password
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('List collaborators availability', function(done) {

        var dtstart = new Date();
        dtstart.setTime(12);
        var dtend = new Date();
        dtend.setTime(15);

        server.get('/rest/account/collaborators', {
            dtstart: dtstart.toJSON(),
            dtend: dtend.toJSON()
        }, function(res, body) {
            console.log(body.$outcome);
            expect(res.statusCode).toEqual(200);
            done();
        });
    });
});
