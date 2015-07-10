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

        var async = require('async');

        function iterator(department, callback) {
            department.getUsers(callback);
        }

        function userSetCollection(user, callback) {
            if (user.roles.account !== undefined) {
                return user.roles.account.setCollection(collection1).then(callback);
            }

            callback();
        }

        async.concat(departments1, iterator, function(err, users) {
            async.each(users, userSetCollection, done);
        });
        /*
        function nextDepartment(i) {

            function setColl(err, arr) {
                i--;

                if (i<=0) {
                    return done();
                }

                nextDepartment(i);

                for(var j=0; j<arr.length; j++) {
                    if (arr[j].roles.account !== undefined) {
                        arr[j].roles.account.setCollection(collection1);
                    }
                }
            }


            departments1[i].getUsers(setColl);
        }

        nextDepartment(departments1.length -1);
        */

    });





    it('close the mock server', function(done) {
        server.close(done);
    });


});
