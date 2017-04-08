'use strict';

let helpers = require('./mockDatabase');
let api = {
    user: require('../../../api/User.api'),
    request: require('../../../api/Request.api'),
    right: require('../../../api/Right.api')
};

describe('Auto adjustment with direct link to user', function() {

    let app, user, sick, sickRenewal, rtt, rttRenewal;
    let dbName = 'rightAutoAdjustmentUserSpec';

    beforeEach(function(done) {
        helpers.mockDatabase(dbName, function(mockapp) {
            app = mockapp;
            done();
        });
    });

    it('create a test user', function(done) {
        api.user.createRandomAccount(app).then(function(randomAccount) {
            expect(randomAccount.user.email).toBeDefined();
            expect(randomAccount.user.roles.account).toBeDefined();
            user = randomAccount.user;

            return api.user.linkToDefaultCollection(app, randomAccount);
		})
        .then(() => {
            done();
        })
        .catch(done);
    });

    it('create sick leave right', function(done) {
        api.right.createRight(app, {
            name: 'Sick leave test',
            quantity: null,
            type: '5740adf51cf1a569643cc50b'
        })
        .then(right => {
            sick = right;
            return sick.addUserBeneficiary(user)
            .then(() => {
                return sick.getLastRenewal();
            });
        })
        .then(renewal => {
            sickRenewal = renewal;
            done();
        })
        .catch(done);
    });

    it('create right with auto adjustment from sick leave', function(done) {
        api.right.createRight(app, {
            name: 'RTT test',
            quantity: 10,
            autoAdjustment: {
                types: ['5740adf51cf1a569643cc50b'],
                quantity: -0.5,
                step: 5
            } // Remove 0.5 days every 5 consumed day of sick leave
        })
        .then(right => {
            rtt = right;
            return api.right.linkToDefaultCollection(app, rtt)
            .then(() => {
                return rtt.getLastRenewal();
            });
        })
        .then(renewal => {
            rttRenewal = renewal;
            done();
        })
        .catch(done);
    });


    it('create 4 day of sickness', function (done) {

        let dtstart = new Date(2016,0,10,8 ,0,0,0);
        let dtend   = new Date(2016,0,14,19,0,0,0);
        api.request.createAbsenceOnRenewal(app, sickRenewal, user, dtstart, dtend, 4)
        .then(request => {
            expect(request.absence.distribution[0].quantity).toEqual(4);
            done();
        })
        .catch(done);
    });


    it('create 1 day of sickness && Check availability on RTT right', function (done) {


        let dtstart = new Date(2016,0,15,8 ,0,0,0);
        let dtend   = new Date(2016,0,15,19,0,0,0);


        let update = Promise.resolve(0);

        app.db.models.Request.autoAdjustmentUpdated = function() {
            update = rttRenewal.getUserAvailableQuantity(user);
            return true;
        };

        let save = api.request.createAbsenceOnRenewal(app, sickRenewal, user, dtstart, dtend, 1);

        save
        .then(request => {
            expect(request.absence.distribution[0].quantity).toEqual(1);
            return update;
        })
        .then(quantity => {
            expect(quantity).toBe(9.5);
            done();
        })
        .catch(done);
    });



    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb(dbName, done);
        });
	});


});
