'use strict';

let api = {
    company: require('../../../api/Company.api.js'),
    department: require('../../../api/Department.api.js')
};



describe("Department API", function CompanyTestSuite() {

    let randomDepartment;

    let server;


    beforeEach(function(done) {

        var helpers = require('../rest/mockServer');

        helpers.mockServer('DepartmentSpecTestDatabase', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });


    it("create random department", function(done) {
		api.department.createRandom(server.app, null, 6, 'secret').then(function(d) {
            expect(d.department.name).toBeDefined();
            expect(d.manager).toBeDefined();
            expect(d.members).toBeDefined();
            expect(d.members.length).toBe(6);
            randomDepartment = d;
			done();
		}).catch(done);
	});



    it('close the mock server', function(done) {
        server.close(done);
    });

});







