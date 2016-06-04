'use strict';


const helpers = require('../rest/mockServer');


const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js')
};

describe('Right renewal', function() {

    let rightModel, renewalModel, user;

    let server;

    beforeEach(function(done) {
        helpers.mockServer('RightRenewalSpecTestDatabase', function(_mockServer) {
            server = _mockServer;

            rightModel = server.app.db.models.Right;
            renewalModel = server.app.db.models.RightRenewal;

            done();
        });
    });


    it("create random account", function(done) {
		api.user.createRandomAccount(server.app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
            user = randomAccount.user;
			done();
		});
	});


    it('verify the getPlannedWorkDayNumber method', function(done) {

        let right = new rightModel();
        right.name = 'French annual leave';
        right.quantity = 25;
        right.quantity_unit = 'D';
        right.addMonthly = {
            quantity: null
        };

        let rightRenewal = new renewalModel();
        rightRenewal.start = new Date(2015,5,1);
        rightRenewal.finish = new Date(2016,4,31);

        right.save((err, right) => {

            expect(err).toBeNull();

            rightRenewal.right = right._id;
            rightRenewal.save((err, rightRenewal) => {
                expect(err).toBeNull();

                rightRenewal.getPlannedWorkDayNumber(user).then(workDays => {
                    expect(workDays).toEqual(228);
                    done();
                }).catch(done);
            });
        });
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
