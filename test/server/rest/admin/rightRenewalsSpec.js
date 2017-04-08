'use strict';


describe('vacations right renewals admin rest service', function() {


    var server;

    /**
     * A right ID created during the tests
     */
    let right;

    /**
     * A renewal ID created during the tests
     */
    let renewal;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer('adminRightRenewals', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });


    it('request rights list as anonymous', function(done) {
        server.get('/rest/admin/rightrenewals', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });


    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });


    it('request all right renewals as admin', function(done) {
        server.get('/rest/admin/rightrenewals', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeDefined();
            done();
        });
    });


    it('create new right with a quantity', function(done) {
        server.post('/rest/admin/rights', {
            name: 'Right test',
            quantity: 25,
            quantity_unit: 'D'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            right = body._id;
            done();
        });
    });


    it('try to create a renewal period without right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2015,0,1,0,0,0,0),
            finish: new Date(2015,11,31,0,0,0,0)
        }, function(res, body) {
            expect(res.statusCode).toEqual(400);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });


    it('try to create a renewal period on a wrong period', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2015,0,1,0,0,0,0),
            finish: new Date(2014,11,31,0,0,0,0),
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(500);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });


    it('Create a first renewal period on right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2015,0,1,0,0,0,0),
            finish: new Date(2015,11,31,23,59,59,0),
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            done();
        });
    });


    it('Create a second renewal period on right', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2016,0,1,0,0,0,0),
            finish: new Date(2016,11,31,23,59,59,0),
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);

            renewal = body._id;

            done();
        });
    });


    it('try to create overlapped period', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2016,2,1,0,0,0,0),
            finish: new Date(2016,2,15,23,59,59,0),
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(500);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });

    it('try to create overlapped period on one day only', function(done) {
        server.post('/rest/admin/rightrenewals', {
            start: new Date(2016,11,31,0,0,0,0),
            finish: new Date(2017,0,15,23,59,59,0),
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(500);
            expect(body.$outcome).toBeDefined();
            expect(body.$outcome.success).toBeFalsy();
            done();
        });
    });


    it('request all right renewals as admin after creation', function(done) {
        server.get('/rest/admin/rightrenewals', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeDefined();
            expect(body.filter(r => r.right === right).length).toEqual(2);
            done();
        });
    });



    it('Update the second renewal period', function(done) {

        let newFinishDate = new Date(2016,11,30,23,59,59,999);

        server.put('/rest/admin/rightrenewals/'+renewal, {
            start: new Date(2016,0,1,0,0,0,0),
            finish: newFinishDate,
            right: right
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            server.expectSuccess(body);
            expect(body.finish).toEqual(newFinishDate.toJSON());
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
