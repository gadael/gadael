'use strict';

var api = require('../../../api/Company.api.js');
var app = require('../../../api/Headless.api.js');

var company = {
			name: 'The Fake Company',
			port: 3001
		};



describe("Company API", function CompanyTestSuite() {

	it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});


	var existingName = null;

	it("fetch databases in array", function(done) {
		api.listDatabases(app, function(databases) {
			expect(databases[0].name).not.toBe(null);
			existingName = databases[0].name;
			done();
		});
	});


	it("forbid creation of an existing database", function(done) {

		expect(existingName).not.toBeNull();

		api.isDbNameValid(app, existingName, function(status) {
			expect(status).toBeFalsy();
			done();
		});

		done();
	});

	var testDbName = 'testDatabase';

	it("check the absence of the test database", function(done) {
		api.isDbNameValid(app, testDbName, function(status) {
			expect(status).toBeTruthy();
			done();
		});
	});

	it("should disconnect from the database", function(done) {
		app.disconnect(function() {
			done();
		});
	});


	it("create a test company", function(done) {
		api.createDb(app, testDbName, company)
		.then(() => {
			api.getCompany(app, testDbName, function(err, companyDoc) {
				expect(companyDoc.name).toEqual(company.name);
				expect(companyDoc.port).toEqual(company.port);
				done(err);
			});
		})
		.catch(done);
	});

	it("drop the test database", function(done) {
		api.dropDb(app, testDbName, function() {
			done();
		});
	});

});
