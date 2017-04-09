'use strict';


describe('adjustments rest service', function() {


    var server;

    var right1, collection1, user1, renewal1, beneficiary1;


    var today = new Date();
    var tomorrow = new Date(today);
    tomorrow.setDate(today.getDate()+1);


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminAdjustments', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('create account 1', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'Adjustments',
            lastname: 'Test',
            email: 'adjustment_user1@example.com',
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
            server.expectSuccess(body);

            user1 = body;
            delete user1.$outcome;
            done();
        });
    });



    it('create right 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Adjustments test 1',
            quantity: 10,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            right1 = body;
            delete right1.$outcome;

            done();
        });
    });



    it('Create collection 1', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Adjustments test 1'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            collection1 = body;
            delete collection1.$outcome;

            done();
        });
    });


    it('Link account to collection', function(done) {
        server.post('/rest/admin/accountcollections', {
            user: user1._id,
            rightCollection: collection1,
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
            document: collection1._id,
            right: right1,
            ref: 'RightCollection'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            beneficiary1 = body._id;
            server.expectSuccess(body);
            done();
        });
    });




    it('create renewal 1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2015,0,1),
            finish: new Date(2015,11,31)
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            renewal1 = body;
            delete renewal1.$outcome;

            done();
        });
    });


    it('list accessible rights from the admin, for an absence request creation, before adjustment', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length > 0) {
                expect(body[0]._id).toEqual(right1._id);
                expect(body[0].renewals).toBeDefined();

                var renewal = body[0].renewals[0];

                expect(renewal.available_quantity).toEqual(10);
            }
            done();
        });
    });



    it('Create adjustment', function(done) {

        server.post('/rest/admin/adjustments', {
            rightRenewal: renewal1._id,
            user: user1._id,
            quantity: -2,
            comment: 'test reduction',
            beneficiary: beneficiary1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });


    it('list accessible rights from the admin, for an absence request creation, after adjustment', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length > 0) {
                var renewal = body[0].renewals[0];
                expect(renewal.available_quantity).toEqual(8);
            }
            done();
        });
    });


    it('Create adjustment 2', function(done) {

        server.post('/rest/admin/adjustments', {
            rightRenewal: renewal1._id,
            user: user1._id,
            quantity: 4,
            comment: 'test add',
            beneficiary: beneficiary1
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            done();
        });
    });


    it('list accessible rights from the admin, for an absence request creation, after adjustment 2', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length > 0) {
                var renewal = body[0].renewals[0];
                expect(renewal.available_quantity).toEqual(12);
            }
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
