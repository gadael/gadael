'use strict';


describe('Overtime admin rest service', function() {

    let server;
    let overtime, overtime2;
    let userAccount;

    beforeEach(function(done) {
        const helpers = require('../mockServer');
        helpers.mockServer('adminOvertimeSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });

    it('request overtimes list as anonymous', function(done) {
        server.get('/rest/admin/overtimes', {}, function(res) {
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

    it('create the user account', function(done) {
        server.createUserAccount()
        .then(function(account) {
            userAccount = account;
            expect(userAccount).toBeDefined();
            done();
        });
    });

    it('create new overtime', function(done) {
        server.post('/rest/admin/overtimes', {
            user: {
                id: userAccount.user.id
            },
            events: [{
                dtstart: new Date(2019,1,1, 8).toJSON(),
                dtend: new Date(2019,1,1, 12).toJSON()
            },{
                dtstart: new Date(2019,1,1, 14).toJSON(),
                dtend: new Date(2019,1,1, 18).toJSON()
            }],
            quantity: 8
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            overtime = body._id;
            done();
        });
    });

    let document;

    it('get the created overtime', function(done) {

        expect(overtime).toBeDefined();

        server.get('/rest/admin/overtimes/'+overtime, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.quantity).toEqual(8);
            expect(body._id).toEqual(overtime);
            document = body;
            done();
        });
    });

    it('update the overtime', function(done) {
        document.quantity = 9;
        server.put('/rest/admin/overtimes/'+overtime, document, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('request overtimes list as admin', function(done) {
        server.get('/rest/admin/overtimes', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });

    it('create overtime 2', function(done) {
        server.post('/rest/admin/overtimes', {
            user: {
                id: userAccount.user.id
            },
            events: [{
                dtstart: new Date(2019,2,1, 8).toJSON(),
                dtend: new Date(2019,2,1, 12).toJSON()
            },{
                dtstart: new Date(2019,2,1, 14).toJSON(),
                dtend: new Date(2019,2,1, 18).toJSON()
            }],
            quantity: 8
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            overtime2 = body._id;
            done();
        });
    });


    it('request overtime summary list as admin', function(done) {
        server.get('/rest/admin/overtimesummary', { 'user': userAccount.user.id }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length === 1) {
                expect(body[0]._id).toEqual('2019');
                expect(body[0].total).toEqual(17);
                expect(body[0].settled).toEqual(0);
            }
            done();
        });
    });

    it('convert overtime quantity to absence right', function(done) {
        const settlement = {
            quantity: 10,
            user: {
                id: userAccount.user.id
            },
            comment: 'Test settlement to right',
            right: {
                name: 'Conversion'
            }
        };
        server.post('/rest/admin/overtimesummary', settlement, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });

    it('settle quantity', function(done) {
        const settlement = {
            quantity: 2,
            user: {
                id: userAccount.user.id
            },
            comment: 'Test basic settlement'
        };
        server.post('/rest/admin/overtimesummary', settlement, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });


    it('have settled the overtime quantity', function(done) {
        server.get('/rest/admin/overtimesummary', { 'user': userAccount.user.id }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body[0].declarations).toEqual(2);
            expect(body[0].total).toEqual(17);
            expect(body[0].settled).toEqual(12);
            done();
        });
    });

    /*
     2 overtimes:
     - 9h -> settlement1 10h (9h)
     - 8h -> settlement1 10h (1h)
          -> settlement2 2h  (2h)
     */

    // Check the 2 overtimes individually

    let firstOvertimeConsuption = null;

    it('Check first overtime consuption', function(done) {
        server.get('/rest/admin/overtimes/'+overtime, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.settled).toBeTruthy();
            expect(body.settlements.length).toEqual(1);
            expect(body.settledQuantity).toEqual(body.quantity);
            firstOvertimeConsuption = body.settledQuantity;
            if (1 === body.settlements.length) {
                expect(body.settlements[0].quantity).toEqual(10);
            }
            done();
        });
    });

    it('Check second overtime consuption', function(done) {
        server.get('/rest/admin/overtimes/'+overtime2, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.settled).toBeFalsy();
            expect(body.settlements.length).toEqual(2);
            expect(body.settledQuantity).toEqual(3);
            if (2 === body.settlements.length) {
                expect(body.settlements[0].quantity).toEqual(10);
                expect(body.settlements[0].right.name).toEqual('Conversion');
                expect(body.settlements[0].right.id).toBeDefined();
                expect(body.settlements[0].right.renewal.id).toBeDefined();

                expect(body.settlements[1].quantity).toEqual(2);
            }
            done();
        });
    });

    it('delete the overtime', function(done) {
        server.delete('/rest/admin/overtimes/'+overtime, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('have deleted a part of the overtime quantity', function(done) {
        server.get('/rest/admin/overtimesummary', { 'user': userAccount.user.id }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body[0].total).toEqual(8);
            expect(body[0].settled).toEqual(3);
            done();
        });
    });

    it('account contain settlement history', function(done) {
        server.get('/rest/admin/users/'+userAccount.user.id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.roles.account.overtimeSettlements.length).toEqual(2);
            done();
        });
    });

    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    // Check if the user see the recovery right

    it('Authenticate user account session', function(done) {
        expect(userAccount.user.roles.account).toBeDefined();
        server.authenticateUser(userAccount).then(function() {
            done();
        });
    });

    it('request list of accessibles rights in renewal', function(done) {
        const now = new Date();
        const end = new Date(now);
        end.setDate(end.getDate()+1);
        server.get('/rest/account/accountrights', {
            dtstart: now.toJSON(),
            dtend: end.toJSON()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (1 === body.length) {
                expect(body[0].name).toEqual('Conversion');
                expect(body[0].quantity_unit).toEqual('H');
                expect(body[0].quantity).toEqual(10);
                expect(body[0].available_quantity).toEqual(10);
            }
            done();
        });
    });

    it('logout & close the mock server', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            server.close(done);
        });
    });
});
