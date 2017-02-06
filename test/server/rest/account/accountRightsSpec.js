'use strict';


describe('account right rest service', function() {


    var server,
        userAdmin,      // create the account
        userAccount,    // create the request

        right1,         // distribution in request
        right2,

        department,     // department associated to userManager
        collection;     // user account collection, contain right1 & 2


    beforeEach(function(done) {
        var helpers = require('../mockServer');

        helpers.mockServer('accountRights', function(_mockServer) {
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
            name: 'Test collection',
            attendance: 100
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
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
            start: new Date(2015,0,1).toJSON(),
            finish: new Date(2015,11,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create renewal 2', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2016,0,1).toJSON(),
            finish: new Date(2016,11,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create Right 2', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right 2',
            quantity: 10,
            quantity_unit: 'D',
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


    it('create renewal 3', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right2._id,
            start: new Date(2015,0,1).toJSON(),
            finish: new Date(2015,11,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('create renewal 4', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right2._id,
            start: new Date(2016,0,1).toJSON(),
            finish: new Date(2016,11,31).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
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


    it('create the user account', function(done) {
        server.createUserAccount(department)
        .then(function(account) {
            userAccount = account;
            done();

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



    it('request list of current requests as account first', function(done) {
        server.get('/rest/account/requests', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });



    it('request list of accessibles rights in renewal', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2015,1,1).toJSON(),
            dtend: new Date(2015,1,2).toJSON(),
            user: '012345678' // ensure the user property is ignored with the account service
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(2);

            if (2 === body.length) {

                body.sort(function(r1, r2) {
                    if (r1.name > r2.name) {
                        return 1;
                    }

                    if (r1.name < r2.name) {
                        return -1;
                    }

                    return 0;
                });

                var r1 = body[0];
                var r2 = body[1];

                expect(r1.name).toEqual('Right 1');
                expect(r2.name).toEqual('Right 2');

                expect(r1.renewals.length).toEqual(1);
                expect(r2.renewals.length).toEqual(2); // the two renewals should be accessibles because no rules
            }
            done();
        });
    });


    it('request list of accessibles rights in the 7 day tolerance period (end of the renewal 1)', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2016,0,1).toJSON(),
            dtend: new Date(2016,0,2).toJSON(),
            user: '012345678' // ensure the user property is ignored with the account service
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(2);

            if (2 === body.length) {
                var r1 = body[0];
                var r2 = body[1];

                expect(r1.name).toEqual('Right 1');
                expect(r2.name).toEqual('Right 2');

                expect(r1.renewals.length).toEqual(2);
                expect(r2.renewals.length).toEqual(2); // the two renewals should be accessibles because no rules
            }
            done();
        });
    });



    it('check account rights before the renewal start', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2014,11,31,8,0,0,0).toJSON(),
            dtend: new Date(2014,11,31,23,59,59,999).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            done();
        });
    });


    it('check account rights after the renewal 2 end, in the tolerance period', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2017,0,5).toJSON(),
            dtend: new Date(2017,0,6).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(2);
            done();
        });
    });


    it('check account rights after the renewal 2 end, after tolerance period', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2017,1,8).toJSON(),
            dtend: new Date(2017,1,9).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });

    it('check account rights after the renewal 2 end, overlapping tolerance period', function(done) {
        server.get('/rest/account/accountrights', {
            dtstart: new Date(2017,1,6).toJSON(),
            dtend: new Date(2017,1,9).toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
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
