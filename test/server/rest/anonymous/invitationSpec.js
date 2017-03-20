'use strict';


describe('Invitation', function() {


    let server, invitation;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('anonymousInvitation', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });




    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });

    it('create invitation', function(done) {
        server.post('/rest/admin/invitations', {
            email: 'guest@example.com'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            invitation = body;
            delete invitation.$outcome;
            done();
        });
    });



    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('get invitation', function(done) {
        server.get('/rest/anonymous/invitation/'+invitation.emailToken, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('create a user with invitation', function(done) {
        server.post('/rest/anonymous/invitation', {
            emailToken: invitation.emailToken,
            lastname: 'test',
            firstname: 'test'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('close the mock server', function(done) {
        server.close(done);
    });

});
