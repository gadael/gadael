'use strict';


describe('calendarevents accout rest service', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('accountCalendarEvents', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request calendar events list as anonymous', function(done) {
        server.get('/rest/account/calendarevents', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create account session', function(done) {
        server.createAccountSession().then(function() {
            done();
        });
    });


    it('request calendar events list as account with missing parameters', function(done) {
        server.get('/rest/account/calendarevents', {}, function(res, body) {
            expect(res.statusCode).toEqual(403);
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });



    it('request calendar events list as account, for all calendars of the user', function(done) {

        var dtstart, dtend, event;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/account/calendarevents', { dtstart: dtstart  , dtend: dtend }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0); // at least for the working periods

            for(var i=0; i<body.length; i++) {
                event = body[i];
                expect(event.dtstart).toBeDefined();
                expect(event.dtend).toBeDefined();
            }

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

