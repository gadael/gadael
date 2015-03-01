'use strict';


describe('Create first admin functionality', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer(function(_mockServer) {
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
                expect(body).toEqual(true);
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
            console.log(body);
            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
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


    it('test if create first admin allowed when the admin account allready exists', function(done) {
        server.get('/rest/anonymous/createfirstadmin', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body).toEqual(false);
            done();
        });

    });


    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });

});
