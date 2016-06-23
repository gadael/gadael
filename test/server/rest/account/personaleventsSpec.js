'use strict';


describe('personalevents accout rest service', function() {


    var server, userAccount;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('userPersonalEvents', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request events list as anonymous', function(done) {
        server.get('/rest/account/personalevents', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create account session', function(done) {

        server.createUserAccount()
        .then(function(account) {
            userAccount = account;
            server.authenticateUser(account).then(function() {
                done();
            });
        });

    });


    it('request personal events list as account with missing parameters', function(done) {
        server.get('/rest/account/personalevents', {}, function(res, body) {
            expect(res.statusCode).toEqual(403);
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });



    it('request personal events list', function(done) {

        var dtstart, dtend;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/account/personalevents', { dtstart: dtstart, dtend: dtend }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBe(0); // no events
            done();
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

