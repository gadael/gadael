'use strict';


describe('Create the first admin', function() {


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


    it('Test if create first admin allowed when the admin account does not exists', function(done) {

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


    it('Test if create first admin allowed when the admin account allready exists', function(done) {

        server.createAdminSession().then(function() {
            server.get('/rest/anonymous/createfirstadmin', {}, function(res, body) {
                expect(res.statusCode).toEqual(200);
                expect(body).toEqual(false);
                done();
            });
        })
        .catch(function() {
            expect(false).toEqual(true);
            done();
        });
    });


    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });

});
