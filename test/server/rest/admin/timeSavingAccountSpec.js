'use strict';


describe('vacations rights admin rest service', function() {


    var server;

    /**
     * A right ID created during the tests
     */
    var right;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminRightTimeSavingAccount', function(_mockServer) {
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

            right = body._id;

            done();
        });
    });



    it('fail to create new right with max 0', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test with wrong quantity unit',
            quantity: 0,
            quantity_unit: 'D',
            timeSaving: {
                active: true,
                max:0
            }
        }, function(res, body) {
            expect(res.statusCode).toEqual(400);
            expect(body._id).toBeUndefined();
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();

            done();
        });
    });



    it('get the created right', function(done) {

        expect(right).toBeDefined();

        server.get('/rest/admin/rights/'+right, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Time saving account');
            expect(body.quantity).toEqual(0);
            expect(body.quantity_unit).toEqual('D');
            expect(body.timeSaving.active).toEqual(true);
            expect(body._id).toEqual(right);
            done();
        });
    });

    it('delete the created right', function(done) {
        server.delete('/rest/admin/rights/'+right, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(right);
            expect(body.name).toEqual('Time saving account');
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            done();
        });
    });





    it('create new time saving account with embeded rules and saving period', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Time saving account',
            quantity: 0,
            quantity_unit: 'D',
            timeSaving: {
                active: true,
                max:25,
                savingInterval: {
                    useDefault: false,
                    min: 2, // years before renewal start date
                    max: 1  // years before renewal end date
                }
            },
            rules: [{
                type: 'entry_date',
                'title': 'Creation date must be in the renewal period'
            },
            {
                type: 'request_period',
                'title': 'Request period must be in the renewal period, with a one week tolerance',
                interval: {
                    min: 7,
                    max: 7
                }
            }]
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.rules).toBeDefined();
            if (undefined !== body.rules) {
                expect(body.rules.length).toEqual(2);
            }
            expect(body.$outcome).toBeDefined();
            if (undefined !== body.$outcome) {
                expect(body.$outcome.success).toBeTruthy();
            }

            right = body._id;

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

