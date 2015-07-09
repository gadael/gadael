'use strict';


describe('Approval on absence request', function() {


    /**
     * @var {mockServer}
     */
    var server;

    /**
     * @var {mockApproval}
     */
    var approval;

    var request1;


    beforeEach(function(done) {
        var mockServerModule = require('../mockServer');
        var mockApproval = require('./mockApproval');

        mockServerModule.mockServer('managerApproval', function(_mockServer) {
            server = _mockServer;

            approval = new mockApproval(server);
            done();
        });
    });


    it('verify the mock objects', function(done) {
        expect(server.app).toBeDefined();
        expect(approval).toBeDefined();
        done();
    });


    it('create departments', function(done) {
        approval.createDepartments(server.app).then(function(departments) {
            expect(departments).toBeDefined();
            departments[7].getAncestors(function(err, ancestors) {
                expect(err).toEqual(null);
                expect(ancestors.length).toEqual(3);
                done();
            });

        });

    });



    it('create collection', function(done) {

        approval.createCollection('Test collection').then(function(collection) {
            collection.getRights().then(function(arr) {
                expect(arr.length).toEqual(4);
                done();
            });
        });
    });



    it('close the mock server', function(done) {
        server.close(done);
    });


});
