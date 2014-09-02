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
    var closeMockServer;
    
    
    it('create the mock server', function(done) {
        closeMockServer = mockServer(function(mockApp) {
            app = mockApp;
            urlOptions.port = app.config.port;
            expect(app).toBeDefined();
            done();
        });
    });
    
    
    it('request users list as anonymous', function(done) {
        
        urlOptions.path = '/rest/admin/users';
        http.request(urlOptions, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        }).end();
    });
    
    
    it('Close the mock server', function(done) {
        closeMockServer(function() {
            done();
        });
    });
    
});
