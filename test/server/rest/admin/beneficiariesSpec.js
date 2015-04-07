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


    // TODO: test beneficiary creation for collection and for account



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

