'use strict';


describe('recover quantity admin rest service', function() {


    var server;

    var savedId;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminRecoverQuantity', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request recoverquantities list as anonymous', function(done) {
        server.get('/rest/admin/recoverquantities', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request recoverquantities list as admin', function(done) {
        server.get('/rest/admin/recoverquantities', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(2); // default values
            done();
        });
    });


    it('create new recover quantity', function(done) {
        server.post('/rest/admin/recoverquantities', {
            name: 'Rest recoverquantity test',
            quantity: 1,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            savedId = body._id;

            done();
        });
    });

    it('get the created recover quantity', function(done) {

        expect(savedId).toBeDefined();

        server.get('/rest/admin/recoverquantities/'+savedId, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Rest recoverquantity test');
            expect(body._id).toEqual(savedId);
            expect(body.quantity).toEqual(1);
            expect(body.quantity_unit).toEqual('D');
            done();
        });
    });

    it('delete the created recoverquantity', function(done) {
        server.delete('/rest/admin/recoverquantities/'+savedId, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(savedId);
            expect(body.name).toEqual('Rest recoverquantity test');
            server.expectSuccess(body);
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

