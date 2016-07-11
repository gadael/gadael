'use strict';


describe('account arrival', function() {


    var server;

    var right1, collection1, user1;



    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('accountArrival', function(_mockServer) {
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



    it('create right 1', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Beneficiaires test 1',
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



    it('create renewal 1', function(done) {
        server.post('/rest/admin/rightrenewals', {
            right: right1._id,
            start: new Date(2015,0,1),
            finish: new Date(2015,11,31)
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });



    it('create account 1', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'beneficiaries',
            lastname: 'Test',
            email: 'beneficiary_user1@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            isAccount: true,
            roles: {
                account: {
                    arrival: new Date(2016, 0, 1).toISOString()
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


    it('Create collection 1', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Beneficiaires test 1'
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
            from: new Date(2015, 0, 1).toISOString(),
        }, function(res, body) {

            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            done();
        });
    });

    it('get associated collections', function(done) {
        server.get('/rest/admin/accountcollections', {
            account: user1.roles.account
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body[0]) {
                expect(body[0].rightCollection._id).toEqual(collection1._id);
            }
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
            server.expectSuccess(body);
            done();
        });
    });


    it('list beneficiaries from the admin', function(done) {

        server.get('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection1._id
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length > 0) {
                expect(body[0].right._id).toEqual(right1._id);
            }
            done();
        });
    });


    it('verify that a right renewal is not accessible before arrival date', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart: new Date(2015, 1, 1).toISOString(),
            dtend: new Date(2015, 1, 2).toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });





    it('update arrival date for account 1', function(done) {

        user1.isAccount = true;
        user1.roles.account = {
            arrival: new Date(2015, 5, 1).toISOString()
        };

        server.put('/rest/admin/users/'+user1._id, user1, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            user1 = body;
            delete user1.$outcome;
            done();
        });
    });



    it('verify that a right quantity is modified if the arrival date is in the renewal period', function(done) {

         server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:new Date(2016, 1, 1).toISOString(),
            dtend:new Date(2016, 1, 2).toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (1 === body.length) {
                var renewal = body[0].renewals[0];
                expect(body[0].available_quantity).toBe(6);
                expect(renewal.available_quantity).toBe(6);
            }
            done();
        });
    });


    it('logout admin', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('close the mock server', function(done) {
        server.close(done);
    });


});

