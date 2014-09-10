'use strict';

describe('users admin rest service', function() {
    
    var mockServer = require('../mockServer')();
    
    var server;
    var app;
    
    /**
     * Admin document created by test 
     */
    var admin;
    
    /**
     * Json result from REST service
     */
    var restAdmin;
    
    it('create the mock server', function(done) {
        server = new mockServer(function(mockApp) {
            expect(mockApp).toBeDefined();
            app = mockApp;
            done();
        });
    });
    
    
    it('request users list as anonymous', function(done) {
        server.get('/rest/admin/users', function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });
    
    
    it('must have same set-cookie in two consecutives requests', function(done) {
        
        server.get('/rest/admin/users', function(res1) {
            server.get('/rest/admin/users', function(res2) {
                expect(res1.headers['set-cookie']).toEqual(res2.headers['set-cookie']);
                done();
            });
        });
    });
    
    
    it('Create admin account on server', function(done) {
        
        var userModel = app.db.models.User;
        
        userModel.encryptPassword('secret', function(err, hash) {
            admin = new userModel();
            admin.password = hash;
            admin.email = 'admin@example.com';
            admin.lastname = 'admin';
            admin.saveAdmin(function(err, user) {
                expect(err).toEqual(null);
                expect(user.roles.admin).toBeDefined();
                admin = user;
                done();
            });
        });
        
    });
    
    
    it('authenticate as admin', function(done) {
        
        server.post('/rest/login', {
            'username': 'admin@example.com',
            'password': 'secret'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            done();
        });
    });
    

    it('request users list as admin', function(done) {
        server.get('/rest/admin/users', function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
            done();
        });
    });
    
    
    it('get user', function(done) {
        
        expect(admin._id).toBeDefined();
        
        server.get('/rest/admin/users/'+admin._id, function(res, body) {
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
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
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
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeTruthy();
            done();
        });
    });
    
    
    it('close the mock server', function(done) {
        server.close(function() {
            done();
        });
    });
    
});
