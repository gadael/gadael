'use strict';


const helpers = require('../rest/mockServer');
const mongoose = require('mongoose');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js'),
    request: require('../../../api/Request.api')
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


    it('verify the getPlannedWorkDayNumber method', function(done) {

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

                rightRenewal.getPlannedWorkDayNumber(user).then(workDays => {

                    // renewal duration = 365
                    // - 105 week-ends days
                    // - 25 days of annual paid leaves
                    // - 8 non working days

                    expect(workDays).toEqual(227);
                    done();
                }).catch(done);
            });
        });
    });


    it('verify getConsuptionHistory method', function(done) {

        let monday = new Date(2016,3,11,0,0,0,0);
        let ObjectId = mongoose.Types.ObjectId;
        let type = new ObjectId('5740adf51cf1a569643cc508');

        api.user.createRandomAccountRequest(server.app, {
            name: 'test getConsuptionHistory'
        }, {
            name: 'test getConsuptionHistory',
            type: type
        },
        monday
        ).then(elem => {
            // get the renewal back as a document
            return renewalModel
            .findOne({ _id: elem.right.renewal.id })
            .populate('right')
            .exec()
            .then(renewal => {
                return renewal.getConsuptionHistory(elem.user.id, [type]);
            })
            .then(history => {
                expect(history.length).toEqual(1);
                done();
            });
        }).catch(done);
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
