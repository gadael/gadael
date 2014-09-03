'use strict';

describe('users admin rest service', function() {
    
    var mockServer = require('../mockServer')();
    
    var server;
    var app;
    
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
    
    
    it('Create admin account', function(done) {
        
        var userModel = app.db.models.User;
        
        userModel.encryptPassword('secret', function(err, hash) {
            var admin = new userModel();
            admin.password = hash;
            admin.email = 'admin@exemple.com';
            admin.lastname = 'admin';
            admin.save(function(err) {
                expect(err).toEqual(null);
                done();
            });
        });
        
    });
    
    
    
    it('Close the mock server', function(done) {
        server.close(function() {
            done();
        });
    });
    
});
