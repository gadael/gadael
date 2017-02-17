'use strict';


describe('time saving account rest service', function() {


    let server, collection, right, savingAccount, userAccount;

    let today = new Date();


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('accountRightTimeSavingAccount', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('create right in days with time saving activated', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Time saving activated',
            quantity: 25,
            quantity_unit: 'D',
            timeSaving: {
                active: true,
                max: 5
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.timeSaving).toBeDefined();
            expect(body.timeSaving.active).toBeTruthy();
            server.expectSuccess(body);

            right = body;

            done();
        });
    });


    it('create renewal', function(done) {

        var start = new Date(today);
        start.setDate(1);
        start.setMonth(0);
        var finish = new Date(start);
        finish.setFullYear(finish.getFullYear()+1);

        server.post('/rest/admin/rightrenewals', {
            right: right._id,
            start: start,
            finish: finish
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });



    it('create a time saving account', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Time saving account',
            quantity: 0,
            quantity_unit: 'D',
            special: 'timesavingaccount',
            timeSavingAccount: {
                max: 20,
                savingInterval: {
                    useDefault: true
                }
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            expect(body._id).toBeDefined();
            expect(body.special).toEqual('timesavingaccount');
            expect(body.timeSaving.active).toBeFalsy();
            expect(body.timeSavingAccount).toBeDefined();


            savingAccount = body;

            done();
        });
    });


    it('create renewal for time saving account', function(done) {

        var start = new Date(today);
        start.setDate(1);
        start.setMonth(0);
        var finish = new Date(start);
        finish.setFullYear(finish.getFullYear()+5);

        server.post('/rest/admin/rightrenewals', {
            right: savingAccount._id,
            start: start,
            finish: finish
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });


    it('Create account session', function(done) {

        server.createUserAccount()
        .then(function(account) {
            userAccount = account;
            done();
        });

    });


    it('create a collection', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Test'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            collection = body;
            done();
        });
    });


    it('Link account to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: userAccount.user._id,
            rightCollection: collection,
            from: today.toISOString(),
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });



    it('Link right to collection with a beneficiary', function(done) {

        server.post('/rest/admin/beneficiaries', {
            document: collection._id,
            right: right,
            ref: 'RightCollection'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            done();
        });
    });


    it('Link time saving account to collection with a beneficiary', function(done) {

        server.post('/rest/admin/beneficiaries', {
            document: collection._id,
            right: savingAccount,
            ref: 'RightCollection'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            done();
        });
    });


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('login account session', function(done) {
        server.authenticateUser(userAccount).then(function() {
            done();
        });
    });


    it('list time saving accounts', function(done) {
        server.get('/rest/account/timesavingaccounts', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);

            if (body.length !== 1) {
                return done();
            }

            let timeSavingAccount = body[0];

            expect(timeSavingAccount.savingPeriod).toBeDefined();
            expect(timeSavingAccount.renewal).toBeDefined();
            expect(timeSavingAccount.beneficiary).toBeDefined();

            if (timeSavingAccount.beneficiary) {
                var beneficiary = timeSavingAccount.beneficiary;
                expect(beneficiary.right).toBeDefined();
                expect(beneficiary.right.quantity).toBeDefined();

            }

            expect(timeSavingAccount.availableQuantity).toBeDefined();
            expect(timeSavingAccount.availableQuantity_dispUnit).toBeDefined();

            done();
        });
    });



    it('close the mock server', function(done) {
        server.close(done);
    });


});
