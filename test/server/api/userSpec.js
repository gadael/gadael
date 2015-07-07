'use strict';

var api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};

var app = require('../../../api/Headless.api.js');

var company = {
			name: 'The Fake Company',
			port: 3001
		};



describe("User API", function CompanyTestSuite() {

	it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});


	var testDbName = 'UserSpecTestDatabase';

	it("check the absence of the test database", function(done) {
		api.company.isDbNameValid(app, testDbName, function(status) {
			expect(status).toBeTruthy();
            if (!status) {
                return done();
            }

            api.company.createDb(app, testDbName, company, function() {
                done();
            });

		});
	});


    it("create random admin", function(done) {
		api.user.createRandomAdmin(app).then(function(user) {
            expect(user.email).toBeDefined();
            expect(user.roles.admin).toBeDefined();
			done();
		});
	});


    it("create random account", function(done) {
		api.user.createRandomAccount(app).then(function(user) {
            expect(user.email).toBeDefined();
            expect(user.roles.account).toBeDefined();
			done();
		});
	});

    it("create random manager", function(done) {
		api.user.createRandomManager(app).then(function(randomManager) {
            expect(randomManager.user.email).toBeDefined();
            expect(randomManager.user.roles.manager).toBeDefined();
			done();
		});
	});


	it("drop the test database", function(done) {
		api.company.dropDb(app, testDbName, function() {
			done();
		});
	});



	it("should disconnect from the database", function(done) {
		app.disconnect(function() {
			done();
		});
	});

});







