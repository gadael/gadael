'use strict';


describe('Create the first admin', function() {


    var server;


    beforeEach(function(done) {

        var helpers = require('../mockServer');

        helpers.mockServer(function(_mockServer) {
            server = _mockServer;
            done();
        });
    });




    it('verify the mock server', function(done) {

        expect(server.app).toBeDefined();
        done();
    });


    it('Test if create first admin allowed', function(done) {
        server.get('/rest/anonymous/createfirstadmin', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });


    it('close the mock server if no more uses', function() {
        server.closeOnFinish();
    });

});
