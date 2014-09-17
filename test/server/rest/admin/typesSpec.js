'use strict';

 
describe('vacations types admin rest service', function() {
    
    
    var server;
    

    beforeEach(function(done) {
        
        var helpers = require('../mockServer');
        
        helpers.mockServer(function(_mockServer) {
            server = _mockServer;
            done();
        });
    });
    

    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });
    
    
    it('request types list as anonymous', function(done) {
        server.get('/rest/admin/types', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });
    
    
    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });
    
    
    it('request types list as admin', function(done) {
        server.get('/rest/admin/types', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(10); // default types
            done();
        });
    });
    
    
    it('create new type', function(done) {
        server.post('/rest/admin/types', {
            name: 'Rest type test',
            group: true
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
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
    
   
    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });

    
});

