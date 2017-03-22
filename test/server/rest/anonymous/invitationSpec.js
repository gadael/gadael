'use strict';


describe('Invitation', function() {


    let server, invitation, invitscope;


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
            invitscope = body;
            done();
        });
    });


    it('create a user with invitation', function(done) {

        expect(invitscope.collections.length).toBeGreaterThan(0);
        expect(invitscope.scheduleCalendars.length).toBeGreaterThan(0);

        server.post('/rest/anonymous/invitation', {
            emailToken: invitation.emailToken,
            lastname: 'test',
            firstname: 'test',
            newpassword: 'secret',
            newpassword2: 'secret',
            collection: invitscope.collections[0]._id,
            scheduleCalendar: invitscope.scheduleCalendars[0]._id
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('Check if authenticated', function(done) {

        server.get('/rest/common', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.sessionUser.isAuthenticated).toEqual(true);
            done();
        });

    });



    it('close the mock server', function(done) {
        server.close(done);
    });

});
