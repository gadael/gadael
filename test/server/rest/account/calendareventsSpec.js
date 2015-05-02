'use strict';


describe('calendarevents accout rest service', function() {


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


    it('request calendar events list as anonymous', function(done) {
        server.get('/rest/admin/calendarevents', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });

    /*
    it('Create account session', function(done) {
        server.createAccountSession().then(function() {
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });
    */

    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });


});

