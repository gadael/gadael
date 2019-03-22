'use strict';


describe('user calendar planning', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminUserCalendarPlanning', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    /**
     * Document created by the test
     */
    var createdUser;

    /**
     * the calendar used in test
     */
    var calendar;

    /**
     * The account schedule calendar used in test
     */
    var accountScheduleCalendar;


    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });



    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });

    it('Get a calendar', function(done) {
        server.get('/rest/admin/calendars', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0);
            if (body[0]) {
                expect(body[0].name).toBeDefined();
                calendar = body[0];
            }
            done();
        });
    });

    it('create new user account', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'create',
            lastname: 'by REST',
            email: 'account_for_calendars@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            isAccount: true,
            roles: {
                account: {
                    seniority: null,
                    notify: {
                        approval: true,
                        allocations: true
                    }
                }
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            createdUser = body;
            delete createdUser.$outcome;


            done();
        });
    });


    it('verify default user account', function(done) {

        expect(createdUser._id).toBeDefined();

        if (undefined === createdUser._id) {
            return done();
        }

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {

            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(createdUser._id.toString());
            expect(body.email).toEqual(createdUser.email);

            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentScheduleCalendar).toEqual(undefined);

            done();
        });
    });

    it('Create a finite schedule calendar period in the past', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() - 2);
        var to = new Date();
        to.setFullYear(to.getFullYear() - 1);

        server.post('/rest/admin/accountschedulecalendars', {
            user: createdUser._id,
            calendar: { _id: calendar._id },
            from: from,
            to: to
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            accountScheduleCalendar = body;
            delete accountScheduleCalendar.$outcome;
            done();
        });

    });


    it('verify the user account to have no schedule calendar', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {

            expect(res.statusCode).toEqual(200);

            if (body.roles) {
                expect(body.roles.account).toBeDefined();
                expect(body.roles.account.currentScheduleCalendar).toEqual(undefined);
            }

            done();
        });
    });



    it('open the account schedule calendar to current date', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() - 2);

        server.put('/rest/admin/accountschedulecalendars/'+accountScheduleCalendar._id, {
            _id: accountScheduleCalendar._id,
            user: createdUser._id,
            calendar: { _id: calendar._id },
            from: from,
            to: undefined
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            done();
        });
    });



    it('verify the user account to have a schedule calendar', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {

            expect(res.statusCode).toEqual(200);

            if (body.roles) {
                expect(body.roles.account).toBeDefined();
                expect(body.roles.account.currentScheduleCalendar).toBeDefined();
                expect(body.roles.account.currentScheduleCalendar._id).toEqual(calendar._id);
            }

            done();
        });
    });


    it('set the account schedule calendar in future', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() + 1);

        server.put('/rest/admin/accountschedulecalendars/'+accountScheduleCalendar._id, {
            _id: accountScheduleCalendar._id,
            user: createdUser._id,
            calendar: { _id: calendar._id },
            from: from,
            to: undefined
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            done();
        });
    });



    it('verify the user account to have no schedule calendar', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {

            expect(res.statusCode).toEqual(200);

            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentScheduleCalendar).toEqual(undefined);

            done();
        });
    });



    it('delete the new user account', function(done) {

        server.delete('/rest/admin/users/'+createdUser._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body._id).toEqual(createdUser._id);

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
