'use strict';


describe('Lunchs admin rest service', function() {


    var server;
    let createdUser;
    /**
     * the calendar used in test
     */
    let calendar;

    /**
     * The account schedule calendar used in test
     */
    let accountScheduleCalendar;

    beforeEach(function(done) {
        var helpers = require('../mockServer');
        helpers.mockServer('adminLunchsSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });

    it('request lunchs list as anonymous', function(done) {
        server.get('/rest/admin/lunchs', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });

    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            expect(theCreatedAdmin.isActive).toBeTruthy();
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
        const arrival = new Date();
        arrival.setDate(arrival.getDate() - 50);
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
                    arrival: arrival,
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


    it('Create a schedule calendar period', function(done) {
        const from = new Date();
        from.setFullYear(from.getFullYear() - 2);

        server.post('/rest/admin/accountschedulecalendars', {
            user: createdUser._id,
            calendar: { _id: calendar._id },
            from: from,
            to: undefined
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            accountScheduleCalendar = body;
            delete accountScheduleCalendar.$outcome;
            done();
        });
    });

    it('Create saved lunchs', function(done) {
        server.app.db.models.Account.findById(createdUser.roles.account, (err, account) => {
            account.lunch.createdUpTo = account.arrival;
            account.saveLunchBreaks()
            .then(() => {
                done();
            })
            .catch(done);
        });
    });

    it('get the lunch list', function(done) {
        server.get('/rest/admin/lunchs', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeDefined();
            expect(body.length).toEqual(2); // 2 months
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
