'use strict';


describe('Right collections admin rest service', function() {


    var server;

    var collection;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminRightCollections', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request collections list as anonymous', function(done) {
        server.get('/rest/admin/collections', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request collections list as admin', function(done) {
        server.get('/rest/admin/collections', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0); // default collections
            done();
        });
    });




    it('create new collection', function(done) {
        server.post('/rest/admin/collections', {
            name: 'Collection test 90%',
            attendance: 90
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);

            collection = body._id;

            done();
        });
    });

    it('get the created collection', function(done) {

        expect(collection).toBeDefined();

        server.get('/rest/admin/collections/'+collection, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Collection test 90%');
            expect(body._id).toEqual(collection);
            expect(body.attendance).toEqual(90);
            done();
        });
    });

    it('delete the created collection', function(done) {
        server.delete('/rest/admin/collections/'+collection, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(collection);
            expect(body.name).toEqual('Collection test 90%');
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

