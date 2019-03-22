'use strict';


describe('connexions on mutiples databases, test process isolation', function() {


    var helpers = require('../mockServer');


    it('login as admin on db 1', function(done) {
        helpers.mockServer('dbSpecDb1', function(server) {
            server.createAdminSession().then(function(theCreatedAdmin) {
                server.get('/rest/user', {}, function(res, body) {
                    expect(res.statusCode).toEqual(200);
                    expect(body._id).toEqual(theCreatedAdmin.id);
                    server.get('/rest/logout', {}, function(res) {
                        expect(res.statusCode).toEqual(200);
                        server.close(done);
                    });
                });
            });
        });
    });

    it('login as admin on db 2', function(done) {
        helpers.mockServer('dbSpecDb2', function(server) {
            server.createAdminSession().then(function(theCreatedAdmin) {
                server.get('/rest/user', {}, function(res, body) {
                    expect(res.statusCode).toEqual(200);
                    expect(body._id).toEqual(theCreatedAdmin.id);
                    server.get('/rest/logout', {}, function(res) {
                        expect(res.statusCode).toEqual(200);
                        server.close(done);
                    });
                });
            });
        });
    }); 

});
