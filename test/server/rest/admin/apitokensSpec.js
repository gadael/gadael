'use strict';

const http = require('http');

describe('users admin rest service', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('apiTokensSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });

    /**
     * Document created by the test
     */
    var createdUser;

    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });

    it('request api token list as anonymous', function(done) {
        server.get('/rest/admin/apitokens', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });

    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            createdUser = theCreatedAdmin;
            expect(theCreatedAdmin.isActive).toBeTruthy();
            done();
        });
    });

    it('request api token list as admin', function(done) {
        server.get('/rest/admin/apitokens', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0);
            done();
        });
    });

    it('create new api token on current user', function(done) {
        server.post('/rest/admin/apitokens', {
            userId: createdUser._id
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            if (200 === res.statusCode) {
                expect(body.clientId).toBeDefined();
            }
            server.expectSuccess(body);
            done();
        });
    });

    var apiTokens = null;

    it('get the api token', function(done) {
        server.get('/rest/admin/apitokens/'+createdUser._id, {}, function(res, body) {
            apiTokens = body;
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    var accessToken = null;

    it('Obtain an accessToken', function(done) {
        server.postUrlEncoded('/login/oauth-token', {
            grant_type: 'client_credentials',
            client_id: apiTokens.clientId,
            client_secret: apiTokens.clientSecret
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.token_type).toEqual('Bearer');
            accessToken = body.access_token;
            done();
        });
    });

    it('query users with invalid bearer token', function(done) {
        http.get({
            hostname: 'localhost',
            port: server.app.config.port,
            path: '/api/admin/users',
            headers: {
                Authorization: 'Bearer invalid'
            }
        }, response => {
            expect(response.statusCode).toEqual(401);
            done();
        });
    });

    it('query users with bearer token', function(done) {
        http.get({
            hostname: 'localhost',
            port: server.app.config.port,
            path: '/api/admin/users',
            headers: {
                Authorization: 'Bearer '+accessToken
            }
        }, response => {
            expect(response.statusCode).toEqual(200);
            let body = '';
            response.on('data', d => { body += d; });
            response.on('end', function() {
                const users = JSON.parse(body);
                expect(users.length).toEqual(1);
                done();
            });
        });
    });

    it('delete the api token on user', function(done) {
        server.delete('/rest/admin/apitokens/'+createdUser._id, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });



    it('failed to get the deleted api token', function(done) {
        server.get('/rest/admin/apitokens/'+createdUser._id, {}, function(res, body) {
            expect(res.statusCode).toEqual(404);
            expect(body.$outcome).toBeDefined();
            if (body.$outcome) {
                expect(body.$outcome.success).toBeFalsy();
            }
            done();
        });
    });

    it('query users with deleted bearer token', function(done) {
        http.get({
            hostname: 'localhost',
            port: server.app.config.port,
            path: '/api/admin/users',
            headers: {
                Authorization: 'Bearer '+accessToken
            }
        }, response => {
            expect(response.statusCode).toEqual(401);
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
