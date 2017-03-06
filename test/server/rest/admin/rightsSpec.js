'use strict';


describe('vacations rights admin rest service', function() {


    var server;

    /**
     * A right ID created during the tests
     */
    var right;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminRight', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request rights list as anonymous', function(done) {
        server.get('/rest/admin/rights', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request rights list as admin', function(done) {
        server.get('/rest/admin/rights', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeDefined(); // Others rights can be created by some tests
            done();
        });
    });


    it('create new right with a quantity', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test',
            quantity: 25,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            right = body._id;

            done();
        });
    });



    it('create new right with empty quantity', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test with empty quantity',
            quantity: 0,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            done();
        });
    });




    it('fail to create new right with wrong quantity unit', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test with wrong quantity unit',
            quantity: 0,
            quantity_unit: 'Z'
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
            expect(body.name).toEqual('Rest right test');
            expect(body.quantity).toEqual(25);
            expect(body.quantity_unit).toEqual('D');
            expect(body._id).toEqual(right);
            done();
        });
    });

    it('delete the created right', function(done) {
        server.delete('/rest/admin/rights/'+right, function(res, body) {
            expect(res.statusCode).toEqual(200);

            if (200 !== res.statusCode) {
                console.log(body.$outcome);
            } else {

                expect(body._id).toEqual(right);
                expect(body.name).toEqual('Rest right test');
                server.expectSuccess(body);
            }
            done();
        });
    });





    it('create new right with embeded rules', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Rest right test with rules',
            quantity: 25,
            quantity_unit: 'D',
            rules: [{
                type: 'entry_date',
                'title': 'Creation date must be in the renewal period'
            },
            {
                type: 'request_period',
                'title': 'Request period must be in the renewal period, with 5 years tolerance',
                interval: {
                    min: 0,
                    max: 5,
                    unit: 'Y'
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
                server.expectSuccess(body);
            }

            right = body._id;

            done();
        });
    });


    it('get the created right and add seniority rule', function(done) {

        expect(right).toBeDefined();

        server.get('/rest/admin/rights/'+right, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.rules).toBeDefined();
            if (!body.rules) {
                return done();
            }

            expect(body.rules.length).toEqual(2);

            expect(body.rules[1].interval.max).toEqual(5);
            expect(body.rules[1].interval.unit).toEqual('Y');

            var edit = body;
            delete edit.$outcome;

            // add a rule

            edit.rules.push({
                type: 'seniority',
                title: 'Accessible on the last 5 years before retirment',
                interval: {
                    min: 5,
                    max: 0
                }
            });

            server.put('/rest/admin/rights/'+right, edit, function(res, body) {
                expect(res.statusCode).toEqual(200);
                expect(body.rules.length).toEqual(3);
                done();
            });

        });
    });



    it('get the created right and remove the seniority rule', function(done) {

        expect(right).toBeDefined();

        server.get('/rest/admin/rights/'+right, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.rules).toBeDefined();
            if (!body.rules) {
                return done();
            }

            expect(body.rules.length).toEqual(3);

            var edit = body;
            delete edit.$outcome;

            edit.rules.splice(2, 1);
            server.put('/rest/admin/rights/'+right, edit, function(res, body) {
                expect(res.statusCode).toEqual(200);
                expect(body.rules.length).toEqual(2);
                done();
            });
        });
    });


    it('test the forBeneficiaryRef parameter', function(done) {
        server.get('/rest/admin/rights', { forBeneficiaryRef: 'User' }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            // get rights not linked to a collection
            server.get('/rest/admin/rights', { forBeneficiaryRef: 'RightCollection' }, function(res, body) {
                expect(res.statusCode).toEqual(200);
                // get rights not linked to a user
                done();
            });
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
