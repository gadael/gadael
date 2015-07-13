'use strict';


describe('Approval on absence request', function() {


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

    var async = require('async');

    /**
     * Callback from async
     */
    function getDepartmentUsers(department, callback) {
        department.getUsers(callback);
    }



    beforeEach(function(done) {
        var mockServerModule = require('../mockServer');
        var mockApproval = require('./mockApproval');

        mockServerModule.mockServer('managerApproval', function(_mockServer) {
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
            async.each(users, userCreateRequest, function(err) {
                expect(err).toBe(undefined);



                done();
            });
        });
    });


    it('contain at least one approval step per request', function() {

        for(var i=0; i< requests.length; i++) {
            expect(requests[i].approvalSteps.length).toBeGreaterThan(0);
        }
    });


    it('contain at least one approver in each approval steps', function() {

        var steps;

        for(var i=0; i< requests.length; i++) {

            steps = requests[i].approvalSteps;
            for(var j=0; j<steps.length; j++) {

                // at least one approver in each steps
                expect(steps[j].approvers.length).toBeGreaterThan(0);
            }
        }
    });


    /**
     * @param {String} departmentName
     * @param {Object} expectations
     *                  Number of requests
     *                  number of approval steps
     *                  Number of approvers for each approval steps in the treatment sequence
     * @param {function} done
     *
     */
    function departmentRequestsExpect(departmentName, expectations, done) {

        var approvalSteps, approvers;

        approval.getRequests(departmentName).then(function(requests) {
            expect(requests.length+' requests').toEqual(expectations.requests+' requests');



            for(var i=0; i<requests.length; i++) {
                expect(requests[i].approvalSteps.length+' approval steps').toEqual(expectations.approvalSteps+' approval steps');

                approvalSteps = requests[i].approvalSteps;
                approvers = expectations.approvers.slice();

                expect(approvalSteps.length).toEqual(approvers.length);

                for(var j=0; j<approvalSteps.length; j++) {
                    expect(approvalSteps[j].approvers.length+' approvers').toEqual(approvers.pop()+' approvers');
                }
            }

            done();

        }, function(err) {
            expect(err).toBe(null);
            done();
        });
    }


    it('verify d0 approval steps', function(done) {
        departmentRequestsExpect('d0', {
            requests: 1,
            approvalSteps: 1,
            approvers: [1]
        }, done);
    });

    it('verify d1 approval steps', function(done) {
        departmentRequestsExpect('d1', {
            requests: 0,
            approvalSteps: 0,
            approvers: []
        }, done); // no requests
    });

    it('verify d2 approval steps', function(done) {
        departmentRequestsExpect('d2', {
            requests: 2,
            approvalSteps: 1,
            approvers: [1]
        }, done);
    });

    it('verify d3 approval steps', function(done) {
        departmentRequestsExpect('d3', {
            requests: 3,
            approvalSteps: 3,
            approvers: [1, 2, 1]
        }, done);
    });

    it('verify d4 approval steps', function(done) {
        departmentRequestsExpect('d4', {
            requests: 1,
            approvalSteps: 2,
            approvers: [2, 1]
        }, done);
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
