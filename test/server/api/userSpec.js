'use strict';

var api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};



describe("User API", function UserTestSuite() {

    let server;

    beforeEach(function(done) {

        var helpers = require('../rest/mockServer');

        helpers.mockServer('UserSpecTestDatabase', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });



    it("create random admin", function(done) {
		api.user.createRandomAdmin(server.app).then(function(randomAdmin) {
            expect(randomAdmin.user.email).toBeDefined();
            expect(randomAdmin.user.roles.admin).toBeDefined();
			done();
		});
	});


    it("create random account", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
			done();
		});
	});

    it("create random manager", function(done) {
		api.user.createRandomManager(server.app).then(function(randomManager) {
            expect(randomManager.user.email).toBeDefined();
            expect(randomManager.user.roles.manager).toBeDefined();
			done();
		});
	});


	it('close the mock server', function(done) {
        server.close(done);
    });

});







