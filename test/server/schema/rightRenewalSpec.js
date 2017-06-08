'use strict';


const helpers = require('../rest/mockServer');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js'),
    request: require('../../../api/Request.api')
};

describe('Right renewal', function() {

    let rightModel, renewalModel, user, additionalRightRenewal;

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


    it('create renewal on default annual leaves right', function(done) {


        let renewal1 = new renewalModel();
        let renewal2 = new renewalModel();

        renewal1.right = '577225e3f3c65dd800257bdc';
        renewal2.right = '577225e3f3c65dd800257bdc';

        renewal1.start = new Date(2013,5,1,0,0,0,0);
        renewal1.finish = new Date(2014,4,31,0,0,0,0);

        renewal2.start = new Date(2014,5,1,0,0,0,0);
        renewal2.finish = new Date(2015,4,31,0,0,0,0);

        Promise.all([renewal1.save(), renewal2.save()])
        .then(all => {
                done();
        })
        .catch(done);
    });



    it('create additional right renewal', function(done) {
        let right = new rightModel();
        right.name = 'Additional right';
        right.quantity = 2;
        right.quantity_unit = 'D';
        right.addMonthly = {
            quantity: null
        };

        let rightRenewal = new renewalModel();
        rightRenewal.start = new Date(2014,0,1);
        rightRenewal.finish = new Date(2014,11,31);

        right.save((err, right) => {

            expect(err).toBeNull();

            rightRenewal.right = right._id;
            rightRenewal.save((err, rightRenewal) => {
                expect(err).toBeNull();

                additionalRightRenewal = rightRenewal;
                done();
            });
        });
    });


    it('verify the renewal duration', function(done) {

        expect(additionalRightRenewal.getDays()).toEqual(365);
        done();

    });


    it('verify the worked days on renewal', function(done) {

        return user.getAccount()
        .then(account => {
            return additionalRightRenewal.getWorkedDays(account);
        })
        .then(workedDays => {
            expect(Object.keys(workedDays).length).toEqual(260);
            done();
        }).catch(done);
    });

    it('verify the week-end days', function(done) {

        return user.getAccount()
        .then(account => {
            return additionalRightRenewal.getWeekEndDays(account);
        })
        .then(weekEnds => {
            expect(weekEnds).toEqual(105);
            done();
        }).catch(done);
    });


    it('verify the number of annual paid leaves', function(done) {

        return additionalRightRenewal.getPaidLeavesQuantity(user)
        .then(paidLeaves => {
            expect(paidLeaves).toEqual(25);
            done();
        }).catch(done);
    });



    it('verify the number of non-working days', function(done) {

        return user.getAccount()
        .then(account => {
            return additionalRightRenewal.getNonWorkingDayQuantity(account);
        })
        .then(nonWorkingDays => {
            expect(nonWorkingDays).toEqual(10);
            done();
        }).catch(done);
    });



    it('verify the getPlannedWorkDayNumber method, (renewal duration - week-end - paid leaves - non working days) ', function(done) {

        additionalRightRenewal.getPlannedWorkDayNumber(user, false)
        .then(workDays => {

            // renewal duration = 365
            // - 105 week-ends days
            // - 25 days of annual paid leaves
            // - 10 non working days

            expect(workDays.value).toEqual(225);
            done();
        }).catch(done);

    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
