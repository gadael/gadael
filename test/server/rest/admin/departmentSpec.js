'use strict';


describe('departments admin rest service', function() {


    var server;

    var department;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminDepartments', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request departments list as anonymous', function(done) {
        server.get('/rest/admin/departments', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request departments list as admin', function(done) {
        server.get('/rest/admin/departments', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0); // no default departments
            done();
        });
    });




    it('create new department', function(done) {
        server.post('/rest/admin/departments', {
            name: 'Test department'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            expect(body.operator).toBeDefined();
            server.expectSuccess(body);

            department = body._id;

            done();
        });
    });

    it('get the created department', function(done) {

        expect(department).toBeDefined();

        server.get('/rest/admin/departments/'+department, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Test department');
            expect(body._id).toEqual(department);
            done();
        });
    });


    it('update the business days', function(done) {

        server.put('/rest/admin/departments/'+department, {
            name: 'Test department 2'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Test department 2');
            done();
        });
    });


    it('verify the updated department', function(done) {

        expect(department).toBeDefined();

        server.get('/rest/admin/departments/'+department, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Test department 2');
            done();
        });
    });


    it('delete the created department', function(done) {
        server.delete('/rest/admin/departments/'+department, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(department);
            expect(body.name).toEqual('Test department 2');
            server.expectSuccess(body);
            done();
        });
    });


    it('request departments list as admin to verify the delete', function(done) {
        server.get('/rest/admin/departments', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toEqual(0); // no default departments
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

