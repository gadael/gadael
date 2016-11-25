'use strict';


describe('beneficiaries rest service', function() {


    var server;

    var right1, collection1, user1;


    var today = new Date();
    var tomorrow = new Date(today);
    tomorrow.setDate(today.getDate()+1);


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminBeneficiaries', function(_mockServer) {
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
            name: 'Beneficiaires test 1',
            quantity: 0,
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


    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('request beneficiaries list as anonymous', function(done) {
        server.get('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection1._id
        }, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });





    it('login as admin', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });




    it('request beneficiaries list as admin', function(done) {
        server.get('/rest/admin/beneficiaries', {
            ref: 'RightCollection',
            document: collection1._id
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0); // no beneficiaries
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


    it('verify that a right without renewal is not accessible for an absence request creation', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
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


    it('list accessible rights from the admin, for an absence request creation', function(done) {

        server.get('/rest/admin/accountrights', {
            user: user1._id,
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            if (body.length > 0) {
                expect(body[0]._id).toEqual(right1._id);
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


    it('login with user1', function(done) {
        server.post('/rest/anonymous/formlogin', {
            'username': 'beneficiary_user1@example.com',
            'password': 'secret'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });



    it('list accessible rights from the account, for an absence request creation', function(done) {

        server.get('/rest/account/accountrights', {
            dtstart:today.toISOString(),
            dtend:tomorrow.toISOString()
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });



    it('logout user1', function(done) {
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

        server.delete('/rest/admin/users/'+user1._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body._id).toEqual(user1._id);

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

