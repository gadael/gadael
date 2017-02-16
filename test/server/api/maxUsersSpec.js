'use strict';

const helpers = require('../rest/mockServer');


const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};



describe("Test max users limit", function MaxUserTestSuite() {

    let server;

    beforeEach(function(done) {
        helpers.mockServer('MaxUserSpecTestDatabase', function(_mockServer) {
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

    it("set max_users to 3", function(done) {
        let companyModel = server.app.db.models.Company;
        companyModel.findOne({}).then(company => {
            company.max_users = 3;
            company.save((err, savedCompany) => {
                expect(err).toBeNull();
                expect(savedCompany.max_users).toEqual(3);
                done();
            });
        }).catch(done);
    });

    it("new random account creation fail because of the limit", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
			done('Error, this creation must fail');
		}).catch(err => {
            expect(err).toBeDefined();
            done();
        });
	});


    let disabledUser = null;


    it("create a disabled user beyond the limit", function(done) {
        api.user.createRandomDisabledAdmin(server.app)
        .then(function(randomAdmin) {
            expect(randomAdmin.user.isActive).toBeFalsy();
            expect(randomAdmin.user.email).toBeDefined();
            expect(randomAdmin.user.roles.admin).toBeDefined();
            disabledUser = randomAdmin.user;
			done();
		})
        .catch(done);
    });

    it('activate the user must fail', function(done) {
        disabledUser.isActive = true;
        disabledUser.save((err, user) => {
            expect(err).toBeDefined();
            done();
        });
    });


	it('close the mock server', function(done) {
        server.close(done);
    });

});
