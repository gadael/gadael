'use strict';


describe('user collections planning', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminUserCollectionPlanning', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    /**
     * Document created by the test
     */
    var createdUser;

    /**
     * the right collection used in test
     */
    var rightCollection;

    /**
     * The account collection used in test
     */
    var accountCollection;


    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });



    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });

    it('Get a right collection', function(done) {
        server.get('/rest/admin/collections', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0);
            expect(body[0].name).toBeDefined();

            rightCollection = body[0];

            done();
        });
    });

    it('create new user account', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'create',
            lastname: 'by REST',
            email: 'account_for_collections@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true,
            isAccount: true,
            roles: {
                account: {
                    seniority: null,
                    notify: {
                        approval: true,
                        allocations: true
                    }
                }
            }
        }, function(res, body) {
            //runs(function () {
                expect(res.statusCode).toEqual(200);

                server.expectSuccess(body);

                createdUser = body;
                delete createdUser.$outcome;
            //});

            done();
        });
    });


    it('verify default user account', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(createdUser._id.toString());
            expect(body.email).toEqual(createdUser.email);

            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentCollection).toEqual(null);
            done();
        });
    });

    it('Create a finite collection period in the past', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() - 2);
        var to = new Date();
        to.setFullYear(to.getFullYear() - 1);

        server.post('/rest/admin/accountcollections', {
            user: createdUser._id,
            rightCollection: { _id: rightCollection._id },
            from: from,
            to: to
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            accountCollection = body;
            delete accountCollection.$outcome;
            done();
        });

    });


    it('verify the user account to have no collection', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentCollection).toEqual(null);
            done();
        });
    });



    it('open the account collection to current date', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() - 2);

        server.put('/rest/admin/accountcollections/'+accountCollection._id, {
            _id: accountCollection._id,
            user: createdUser._id,
            rightCollection: { _id: rightCollection._id },
            from: from,
            to: undefined
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            done();
        });
    });



    it('verify the user account to have a collection', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentCollection).toBeDefined();
            expect(body.roles.account.currentCollection._id).toEqual(rightCollection._id);
            done();
        });
    });


    it('set the account collection in future', function(done) {

        var from = new Date();
        from.setFullYear(from.getFullYear() + 1);

        server.put('/rest/admin/accountcollections/'+accountCollection._id, {
            _id: accountCollection._id,
            user: createdUser._id,
            rightCollection: { _id: rightCollection._id },
            from: from,
            to: undefined
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            done();
        });
    });



    it('verify the user account to have no collection', function(done) {

        expect(createdUser._id).toBeDefined();

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.roles.account).toBeDefined();
            expect(body.roles.account.currentCollection).toEqual(null);
            done();
        });
    });



    it('delete the new user account', function(done) {

        server.delete('/rest/admin/users/'+createdUser._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body._id).toEqual(createdUser._id);

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
