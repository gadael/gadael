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
            right1 = body._id;

            done();
        });
    });


    // TODO: create the account 1
    // TODO: create the collection 1
    // TODO: test beneficiary creation for collection and for account
    // TODO: test delete beneficiary

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

