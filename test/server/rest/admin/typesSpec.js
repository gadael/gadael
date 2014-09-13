'use strict';

describe('vacations types admin rest service', function() {
    
    var mockServer = require('../mockServer')();
    
    var server;

    
    it('create the mock server', function(done) {
        server = new mockServer(3003, function(mockApp) {
            expect(mockApp).toBeDefined();
            done();
        });
    });
    
    
    it('request types list as anonymous', function(done) {
        server.get('/rest/admin/types', function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });
    
    
    
    it('close the mock server', function(done) {
        server.close(function() {
            done();
        });
    });
    
});
