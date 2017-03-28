'use strict';


describe('calendarevents accout rest service', function() {


    var server, userAccount, event1;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('userCalendarEvents', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request calendar events list as anonymous', function(done) {
        server.get('/rest/user/calendarevents', {}, function(res) {
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


    it('request calendar events list as account with missing parameters', function(done) {
        server.get('/rest/user/calendarevents', {}, function(res, body) {
            expect(res.statusCode).toEqual(403);
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });



    it('request workingtimes as account, without working period', function(done) {

        var dtstart, dtend;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/user/calendarevents', { dtstart: dtstart, dtend: dtend, type: 'workschedule' }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBe(0); // no working period defined
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


    it('request workingtimes as account, with working period set', function(done) {

        var dtstart, dtend, event;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/user/calendarevents', { dtstart: dtstart, dtend: dtend, type: 'workschedule' }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0); // at least for the working periods

            event1 = body[0];

            for(var i=0; i<body.length; i++) {
                event = body[i];
                expect(event.dtstart).toBeDefined();
                expect(event.dtend).toBeDefined();
            }

            done();
        });
    });

    it('get workingtime event if requested with same period', function(done) {

        server.get('/rest/user/calendarevents', { dtstart: event1.dtstart, dtend: event1.dtend, type: 'workschedule' }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });

    it('get workingtime event if requested with smaller period', function(done) {

        let afterStart = new Date(event1.dtstart);
        afterStart.setTime(afterStart.getTime() + 10*60000);
        let beforeEnd = new Date(event1.dtend);
        beforeEnd.setTime(beforeEnd.getTime() - 10*60000);



        server.get('/rest/user/calendarevents', {
            dtstart: afterStart.toJSON(), dtend: beforeEnd.toJSON(), type: 'workschedule'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });


    it('get workingtime event if requested with begin cross event', function(done) {

        let beforeStart = new Date(event1.dtstart);
        beforeStart.setTime(beforeStart.getTime() - 10*60000);
        let beforeEnd = new Date(event1.dtend);
        beforeEnd.setTime(beforeEnd.getTime() - 10*60000);



        server.get('/rest/user/calendarevents', {
            dtstart: beforeStart.toJSON(), dtend: beforeEnd.toJSON(), type: 'workschedule'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });


    it('get workingtime event if requested with end cross event', function(done) {

        let afterStart = new Date(event1.dtstart);
        afterStart.setTime(afterStart.getTime() + 10*60000);
        let afterEnd = new Date(event1.dtend);
        afterEnd.setTime(afterEnd.getTime() + 10*60000);



        server.get('/rest/user/calendarevents', {
            dtstart: afterStart.toJSON(), dtend: afterEnd.toJSON(), type: 'workschedule'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });




    it('request workingtimes as account, with optional subtractions', function(done) {

        var dtstart, dtend, event;

        dtstart = new Date(2015,1,1).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/user/calendarevents', {
            dtstart: dtstart,
            dtend: dtend,
            type: 'workschedule',
            subtractNonWorkingDays: true,
            subtractPersonalEvents: true
        }, function(res, body) {
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




    it('request workingtimes as account, with optional exceptions', function(done) {

        var dtstart, dtend, event;

        dtstart = new Date(2015,9,24,22).toJSON();
        dtend = new Date(2015,2,1).toJSON();

        server.get('/rest/user/calendarevents', {
            dtstart: '2015-10-24T22:00:00.000Z',
            dtend: '2015-10-31T23:00:00.000Z',
            type: 'workschedule',
            subtractNonWorkingDays: true,
            subtractPersonalEvents: true,
            subtractException: '5636712ff350ada4143117f5'
        }, function(res, body) {
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



    it('close the mock server', function(done) {
        server.close(done);
    });


});
