'use strict';


describe('Create first admin functionality', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('anonymousCreateFirstAdmin', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });




    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });


    it('test if create first admin allowed when the admin account does not exists', function(done) {

        server.deleteAdminAccountIfExists().then(function() {
            server.get('/rest/anonymous/createfirstadmin', {}, function(res, body) {
                expect(res.statusCode).toEqual(200);
                expect(body.allowed).toEqual(true);
                done();
            });
        })
        .catch(function() {
            expect(false).toEqual(true);
            done();
        });
    });


    it('create the first admin', function(done) {
        server.post('/rest/anonymous/createfirstadmin', {
            firstname: 'first',
            lastname: 'admin',
            email: 'admin@example.com',
            newpassword: 'secret',
            newpassword2: 'secret'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });


    it('Check if authenticated', function(done) {

        server.get('/rest/common', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.sessionUser.isAuthenticated).toEqual(true);
            done();
        });

    });


    it('logout admin', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('do not create the first admin twice', function(done) {
        server.post('/rest/anonymous/createfirstadmin', {
            firstname: 'first',
            lastname: 'admin',
            email: 'admin2@example.com',
            newpassword: 'secret',
            newpassword2: 'secret'
        }, function(res, body) {
            expect(res.statusCode).toEqual(401);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });


    it('test if create first admin allowed when the admin account already exists', function(done) {
        server.get('/rest/anonymous/createfirstadmin', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.allowed).toEqual(false);
            done();
        });

    });


    it('close the mock server', function(done) {
        server.close(done);
    });

});
