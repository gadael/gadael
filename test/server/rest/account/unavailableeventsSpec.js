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
            server.authenticateUser(account).then(function() {
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
            var to = new Date(2022,1,1);

            server.post('/rest/admin/accountschedulecalendars', {
                user: userAccount.user._id,
                calendar: { _id: calendar._id },
                from: from,
                to: to
            }, function(res, body) {
                expect(res.statusCode).toEqual(200);
                server.expectSuccess(body);
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
        server.authenticateUser(userAccount).then(function() {
            done();
        });
    });




    function testDate(dtstart, expectedNonWorkingPeriod, callback) {

        let event;
        let dtend = new Date(dtstart);
        dtend.setDate(dtend.getDate()+1);

        server.get('/rest/account/unavailableevents', { dtstart: dtstart.toJSON(), dtend: dtend.toJSON() }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(expectedNonWorkingPeriod);

            for(var i=0; i<body.length; i++) {
                event = body[i];
                expect(event.dtstart).toBeDefined();
                expect(event.dtend).toBeDefined();
            }

            callback();
        });

    }



    it('request unavailableevents as account on a monday, with working period set', function(done) {

        testDate(new Date(2015, 4, 4), 3, done);
    });

    it('request unavailableevents as account on a sunday', function(done) {

        testDate(new Date(2015, 4, 2), 1, done);
    });

    it('request unavailableevents as account on a non-working day', function(done) {

        testDate(new Date(2015, 4, 1), 1, done);
    });

    it('request unavailableevents as account on one month', function(done) {
        server.get('/rest/account/unavailableevents', { dtstart: new Date(2015,11,1).toJSON(), dtend: new Date(2016,0,1).toJSON() }, function(res, body) {
            expect(body.length).toEqual(45);
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('request unavailableevents as account on one year', function(done) {
        server.get('/rest/account/unavailableevents', { dtstart: new Date(2015,0,1).toJSON(), dtend: new Date(2016,0,1).toJSON() }, function(res, body) {
            expect(body.length).toEqual(463);
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('request unavailableevents on a working day', function(done) {
        const dtstart = new Date(2020,5,2, 7, 0);
        const dtend = new Date(2020,5,2, 12, 0);
        server.get('/rest/account/unavailableevents', { dtstart: dtstart.toJSON(), dtend: dtend.toJSON() }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            const event = body[0];
            const dtstart = new Date(event.dtstart);
            const dtend = new Date(event.dtend);
            expect(dtstart.getDate()).toEqual(2);
            expect(dtend.getDate()).toEqual(2);
            const startHour = (dtstart.getHours() + (dtstart.getMinutes() / 60));
            const endHour = (dtend.getHours() + (dtend.getMinutes() / 60));
            expect(endHour - startHour).toEqual(1);
            done();
        });
    });

    it('request unavailableevents on a non working day', function(done) {
        const dtstart = new Date(2020,5,1, 8, 0);
        const dtend = new Date(2020,5,1, 12, 0);
        server.get('/rest/account/unavailableevents', { dtstart: dtstart.toJSON(), dtend: dtend.toJSON() }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            const event = body[0];
            const dtstart = new Date(event.dtstart);
            const dtend = new Date(event.dtend);
            expect(dtstart.getDate()).toEqual(1);
            expect(dtend.getDate()).toEqual(1);
            const startHour = (dtstart.getHours() + (dtstart.getMinutes() / 60));
            const endHour = (dtend.getHours() + (dtend.getMinutes() / 60));
            expect(endHour - startHour).toEqual(4);
            done();
        });
    });

    it('close the mock server', function(done) {
        server.close(done);
    });


});
