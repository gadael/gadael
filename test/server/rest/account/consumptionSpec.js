'use strict';


describe('consumption account rest service', function() {


    var server,
        userAdmin,      // create the account
        userAccount,    // create the request

        right1,         // distribution in request
        right2,

        renewal1,
        renewal2,

        department,     // department associated to userManager
        collection;     // user account collection, contain right1 & 2


    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('accountConsumption', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request list accountrights as anonymous', function(done) {
        server.get('/rest/account/accountrights', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    // admin actions


    it('Create admin session needed for prerequisits', function(done) {
        server.createAdminSession().then(function(user) {
            userAdmin = user;
            expect(userAdmin.roles.admin).toBeDefined();
            done();
        });
    });


    it('Create a collection', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Part-time collection',
            attendance: 75
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.businessDays.MO).toEqual(true);
            collection = body;
            delete collection.$outcome;
            done();
        });
    });


    it('create Right 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right 1',
            quantity: 25,
            quantity_unit: 'D',
            consumption: 'proportion',
            rules: [{
                type: 'request_period',
                'title': 'Request period must be in the renewal period, with a 7 day tolerance at the end of period',
                interval: {
                    min:0,
                    max:7
                }
            }]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right1 = body;
            expect(right1._id).toBeDefined();
            done();
        });
    });


    it('link the right1 to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: right1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal 1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2014,1,1).toJSON(),
            finish: new Date(2015,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            renewal1 = body;
            delete renewal1.$outcome;
            done();
        });
    });





    it('create Right 2', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right 2',
            quantity: 10,
            quantity_unit: 'D',
            consumption: 'businessDays',
            rules: [] // no rules, always available
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            right2 = body;
            expect(right2._id).toBeDefined();
            done();
        });
    });




    it('link the right2 to collection', function(done) {
        server.post('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection._id,
            right: right2
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal 2', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right2._id,
            start: new Date(2014,1,1).toJSON(),
            finish: new Date(2015,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            renewal2 = body;
            delete renewal2.$outcome;
            done();
        });
    });




    it('create a department', function(done) {
        server.post('/rest/admin/departments', {
            name: 'Test entity'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            department = body;
            done();
        });
    });


    it('create the user account and set default workschedule calendar', function(done) {
        server.createUserAccount(department)
        .then(function(account) {
            userAccount = account;

            var find = server.app.db.models.Calendar.findOne({ type: 'workschedule' });
            find.exec(function(err, calendar) {
                var from = new Date(2014,1,1);
                var to = new Date(2015,1,1);

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

    });





    it('link user to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: userAccount.user._id,
            rightCollection: collection,
            from: new Date(2014,1,1).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });





    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    // account session part


    it('Authenticate user account session', function(done) {
        expect(userAccount.user.roles.account).toBeDefined();
        server.authenticateUser(userAccount).then(function() {
            done();
        });

    });

    it('Check consumption on a period', function(done) {

        let am_start = new Date(2014, 2, 3, 8, 0, 0, 0).toString();
        let am_end   = new Date(2014, 2, 3, 12, 0, 0, 0).toString();
        let pm_start = new Date(2014, 2, 3, 13, 0, 0, 0).toString();
        let pm_end   = new Date(2014, 2, 3, 18, 0, 0, 0).toString();

        let params = {
            selection: {
                begin: am_start,
                end: pm_end
            },
            distribution: [
                {
                    right: {
                        id: right1._id
                    },
                    quantity: 0.5,
                    events: [
                        {
                            dtstart: am_start,
                            dtend: am_end
                        }
                    ]
                },
                {
                    right: {
                        id: right2._id
                    },
                    quantity: 0.5,
                    events: [
                        {
                            dtstart: pm_start,
                            dtend: pm_end
                        }
                    ]
                }
            ],
            collection: collection._id
        };

        server.post('/rest/account/consumption', params, function(res, body) {
            expect(res.statusCode).toEqual(200);
            
            expect(body[renewal1._id]).toBeDefined();
            expect(body[renewal2._id]).toBeDefined();

            expect(body[renewal1._id]).toBeCloseTo(0.67);
            expect(body[renewal2._id]).toBeCloseTo(1);

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
