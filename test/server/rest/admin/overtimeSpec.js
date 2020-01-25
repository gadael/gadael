'use strict';


describe('Overtime admin rest service', function() {

    let server;
    let overtime;
    let userAccount;

    beforeEach(function(done) {
        const helpers = require('../mockServer');
        helpers.mockServer('adminOvertimeSpec', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });

    it('request overtimes list as anonymous', function(done) {
        server.get('/rest/admin/overtimes', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });

    it('Create admin session', function(done) {
        server.createAdminSession().then(function(theCreatedAdmin) {
            expect(theCreatedAdmin.isActive).toBeTruthy();
            done();
        });
    });

    it('create the user account', function(done) {
        server.createUserAccount()
        .then(function(account) {
            userAccount = account;
            expect(userAccount).toBeDefined();
            done();
        });
    });

    it('create new overtime', function(done) {
        server.post('/rest/admin/overtimes', {
            user: {
                id: userAccount.user.id
            },
            events: [{
                dtstart: new Date(2019,1,1, 8).toJSON(),
                dtend: new Date(2019,1,1, 12).toJSON()
            },{
                dtstart: new Date(2019,1,1, 14).toJSON(),
                dtend: new Date(2019,1,1, 18).toJSON()
            }],
            quantity: 8
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            overtime = body._id;
            done();
        });
    });

    let document;

    it('get the created overtime', function(done) {

        expect(overtime).toBeDefined();

        server.get('/rest/admin/overtimes/'+overtime, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.quantity).toEqual(8);
            expect(body._id).toEqual(overtime);
            document = body;
            done();
        });
    });

    it('update the overtime', function(done) {

        document.quantity = 9;

        server.put('/rest/admin/overtimes/'+overtime, document, function(res, body) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });

    it('request overtimes list as admin', function(done) {
        server.get('/rest/admin/overtimes', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(1);
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
