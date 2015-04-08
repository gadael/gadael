'use strict';


describe('beneficiaries rest service', function() {


    var server;

    var right1, collection1, account1;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer(function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request beneficiaries list as anonymous', function(done) {
        server.get('/rest/admin/beneficiaries', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request beneficiaries list as admin', function(done) {
        server.get('/rest/admin/beneficiaries', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0); // no default beneficiaries
            done();
        });
    });


    it('create right 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Beneficiaires test 1',
            quantity: 0,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();

            right1 = body;
            delete right1.$outcome;

            done();
        });
    });



    it('create account 1', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'beneficiaries',
            lastname: 'Test',
            email: 'beneficiary_account1@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            isAccount: true,
            roles: {
                account: {
                }
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();

            account1 = body;
            delete account1.$outcome;

            done();
        });
    });


    it('Create collection 1', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Beneficiaires test 1'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();

            collection1 = body;
            delete collection1.$outcome;

            done();
        });
    });


    it('Link account to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            account: account1,
            rightCollection: collection1,
            from: new Date()
        }, function(res, body) {

            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            done();
        });
    });


    it('Link right to collection with a beneficiary', function(done) {
        server.post('/rest/admin/beneficiaries', {
            document: collection1._id,
            right: right1,
            ref: 'RightCollection'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            done();
        });
    });


    it('list accessible rights from the admin', function(done) {

        server.get('/rest/admin/beneficiaries', {
            account: account1._id
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            expect(body[0].right._id).toEqual(right1._id);
            done();
        });
    });


    it('logout admin', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('login with account1', function(done) {
        server.post('/rest/login', {
            'username': 'beneficiary_account1@example.com',
            'password': 'secret'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('list accessible rights from the account', function(done) {

        server.get('/rest/account/accountrights', {
            dtstart: new Date(),
            dtend: new Date()
        }, function(res, body) {

            console.log(body.$outcome);

            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });



    it('logout account1', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('Reconnect with admin', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('delete the new user', function(done) {

        server.delete('/rest/admin/users/'+account1._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            expect(body._id).toEqual(account1._id);

            done();
        });
    });

    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });


});

