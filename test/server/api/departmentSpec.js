'use strict';

let api = {
    company: require('../../../api/Company.api.js'),
    department: require('../../../api/Department.api.js')
};

let app = require('../../../api/Headless.api.js');

let company = {
			name: 'The Fake Company',
			port: 3001
		};



describe("Department API", function CompanyTestSuite() {

    let randomDepartment;


	it("should connect to the database", function(done) {
		app.connect(function() {
			done();
		});
	});


	let testDbName = 'DepartmentSpecTestDatabase';

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


    it("create random department", function(done) {
		api.department.createRandom(app, null, 6, 'secret').then(function(d) {
            expect(d.department.name).toBeDefined();
            expect(d.manager).toBeDefined();
            expect(d.members).toBeDefined();
            expect(d.members.length).toBe(6);
            randomDepartment = d;
			done();
		}).catch(done);
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







