'use strict';

describe('users admin rest service', function() {
    
    var mockServer = require('../mockServer');
    var app = null;
    var urlOptions = {
      hostname: 'localhost',
      port: 80,
      path: '/rest',
      method: 'GET',
      agent: false,
      headers: { 'Connection': 'Close' }
    };
    var http = require('http');
    
    
    
    it('create the mock server', function(done) {
        mockServer(function(mockApp) {
            app = mockApp;
            urlOptions.port = app.config.port;
            expect(app).toBeDefined();
            done();
        });
    });
    
    /*
    it('request users list as anonymous', function(done) {
        
        urlOptions.path = '/rest/admin/users';

        var req = http.request(urlOptions, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
        
        req.shouldKeepAlive = false;
        req.end();
        
    });
    */
    
    it('Destroy the mock server', function(done) {
        app.server.close(done);
    });
});
