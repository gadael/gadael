'use strict';


describe('unavailableevents accout rest service', function() {


    var server, userAccount;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('accountUnavailableEvents', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request unavailableevents list as anonymous', function(done) {
        server.get('/rest/account/unavailableevents', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create account session', function(done) {

        server.createUserAccount()
        .then(function(account) {
            userAccount = account;
            server.authenticateAccount(account).then(function() {
                done();
            });
        });

    });


    it('request unavailableevents list as account with missing parameters', function(done) {
        server.get('/rest/account/unavailableevents', {}, function(res, body) {
            expect(res.statusCode).toEqual(403);
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });



    it('request unavailableevents as account, without working period', function(done) {

        var dtstart, dtend;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/account/unavailableevents', { dtstart: dtstart, dtend: dtend }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBe(1); // no working period defined
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('login as admin', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('set a working period for account', function(done) {

        var find = server.app.db.models.Calendar.findOne({ type: 'workschedule' });
        find.exec(function(err, calendar) {
            var from = new Date(2015,1,1);
            var to = new Date(2016,1,1);

            server.post('/rest/admin/accountschedulecalendars', {
                user: userAccount.user._id,
                calendar: { _id: calendar._id },
                from: from,
                to: to
            }, function(res, body) {
                expect(res.statusCode).toEqual(200);
                expect(body.$outcome.success).toBeTruthy();
                done();
            });
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('Authenticate as account', function(done) {
        server.authenticateAccount(userAccount).then(function() {
            done();
        });
    });


    it('request unavailableevents as account, with working period set', function(done) {

        var dtstart, dtend, event;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/account/unavailableevents', { dtstart: dtstart, dtend: dtend }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(1); // at least for the working periods

            for(var i=0; i<body.length; i++) {
                event = body[i];
                expect(event.dtstart).toBeDefined();
                expect(event.dtend).toBeDefined();
            }

            done();
        });
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});

