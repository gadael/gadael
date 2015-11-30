'use strict';


describe('time saving account rest service', function() {


    var server, timeSavingAccount;



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


    it('create new time saving account right in days', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Time saving account',
            quantity: 0,
            quantity_unit: 'D',
            timeSaving: {
                active: true
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.timeSaving).toBeDefined();
            expect(body.timeSaving.active).toBeTruthy();
            expect(body.timeSaving.savingInterval).toBeDefined();
            expect(body.timeSaving.savingInterval.useDefault).toBeTruthy();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();

            done();
        });
    });



    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create account session', function(done) {
        server.createAccountSession().then(function() {
            done();
        });
    });


    it('list time saving accounts', function(done) {
        server.get('/rest/account/timesavingaccounts', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            timeSavingAccount = body[0];
            done();
        });
    });



    it('close the mock server', function(done) {
        server.close(done);
    });


});

