'use strict';


describe('users admin rest service', function() {


    var server;


    beforeEach(function(done) {
        var helpers = require('../mockServer');
        helpers.mockServer('adminUsersSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });




    /**
     * Json result from REST service
     */
    var restAdmin;

    /**
     * Document created by the test
     */
    var createdUser;

    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });

    it('request users list as anonymous', function(done) {
        server.get('/rest/admin/users', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });

    it('must have same set-cookie in two consecutives requests', function(done) {

        server.get('/rest/admin/users', {}, function(res1) {
            server.get('/rest/admin/users', {}, function(res2) {
                expect(res1.headers['set-cookie']).toEqual(res2.headers['set-cookie']);
                done();
            });
        });
    });

    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            expect(theCreatedAdmin.isActive).toBeTruthy();
            done();
        });
    });

    it('request users list as admin', function(done) {
        server.get('/rest/admin/users', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });


    it('get user', function(done) {

        var admin = server.admin;
        expect(admin._id).toBeDefined();

        server.get('/rest/admin/users/'+admin._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(admin._id.toString());
            expect(body.email).toEqual(admin.email);
            expect(body.firstname).toEqual(admin.firstname);
            expect(body.lastname).toEqual(admin.lastname);

            restAdmin = body;

            done();
        });
    });



    it('edit a user', function(done) {

        expect(restAdmin).toBeDefined();
        restAdmin.firstname = 'admin';
        restAdmin.isAdmin = true;

        server.put('/rest/admin/users/'+restAdmin._id, restAdmin, function(res, body) {

            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });




    it('prevent to remove a mandatory value', function(done) {

        expect(restAdmin).toBeDefined();

        restAdmin.lastname = '';
        restAdmin.email = '';

        server.put('/rest/admin/users/'+restAdmin._id, restAdmin, function(res, body) {
            expect(res.statusCode).toEqual(400);
            expect(body).toBeDefined();
            if (body) {
                expect(body.$outcome).toBeDefined();
                expect(body.$outcome.success).toBeFalsy();
            }
            done();
        });
    });



    it('Disable a user', function(done) {

        expect(restAdmin).toBeDefined();
        restAdmin.lastname = 'admin';
        restAdmin.email = 'email@example.com';
        restAdmin.isActive = false;

        server.put('/rest/admin/users/'+restAdmin._id, restAdmin, function(res, body) {

            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();

            if (body.$outcome !== undefined) {
                server.expectSuccess(body);
                expect(body.validInterval).toBeDefined();


                expect(body.validInterval.length).toEqual(1);

                let last = body.validInterval.length -1;
                expect(body.validInterval[last].start).toBeDefined();
                expect(body.validInterval[last].finish).toBeDefined();

            }
            done();
        });
    });



    it('Enable a user must create a new validInterval', function(done) {

        expect(restAdmin).toBeDefined();
        restAdmin.isActive = true;

        server.put('/rest/admin/users/'+restAdmin._id, restAdmin, function(res, body) {

            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();

            if (undefined !== body.$outcome) {
                server.expectSuccess(body);
                expect(body.validInterval.length).toEqual(2);
            }
            done();
        });
    });




    it('create new user', function(done) {
        server.post('/rest/admin/users', {
            firstname: 'create',
            lastname: 'by REST',
            email: 'rest@example.com',
            department: null,
            setpassword: true,
            newpassword: 'secret',
            newpassword2: 'secret',
            isActive: true
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            createdUser = body;
            delete createdUser.$outcome;

            done();
        });
    });



    it('delete the new user', function(done) {

        server.delete('/rest/admin/users/'+createdUser._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body._id).toEqual(createdUser._id);

            done();
        });
    });


    it('failed to get the deleted user', function(done) {

        server.get('/rest/admin/users/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(404);
            expect(body.$outcome).toBeDefined();
            if (body.$outcome) {
                expect(body.$outcome.success).toBeFalsy();
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
