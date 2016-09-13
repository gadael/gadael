'use strict';

const helpers = require('../screenServer');


describe('users admin rest service for documentation', function() {


    var server;


    beforeEach(function(done) {
        helpers.mockServer('docAdminUsersSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    /**
     * Document created by the test
     */
    var createdUser;

    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });



    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            expect(theCreatedAdmin.isActive).toBeTruthy();
            done();
        });
    });



    it('request users list as admin', function(done) {
        server.get('/rest/admin/users', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });



    it('create new user', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            roles: {
                account: {
                    arrival: new Date(),
                    seniority: new Date(),
                    sage: {
                        registrationNumber: '00254971'
                    }
                }
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            createdUser = body;
            delete createdUser.$outcome;


            server.webshot('/admin/users', 'userlist-with-one-admin')
            .then(server.webshot('/admin/users/'+server.admin._id, 'user-admin-view'))
            .then(server.webshot('/admin/user-edit/'+server.admin._id, 'user-admin-edit'))
            .then(server.webshot('/admin/users/'+createdUser._id, 'user-account-view'))
            .then(server.webshot('/admin/user-edit/'+createdUser._id, 'user-account-edit'))
            .then(done);

        });
    });



    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('close the mock server', function(done) {
        server.close(done);
    });

});
