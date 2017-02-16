'use strict';


const helpers = require('../rest/mockServer');
const mongoose = require('mongoose');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js'),
    request: require('../../../api/Request.api')
};

const consumptionHistory = require('../../../modules/consumptionHistory');


describe('Consuption history module', function() {

    let server;
    let ObjectId = mongoose.Types.ObjectId;
    let type = new ObjectId('5740adf51cf1a569643cc508'); // annual paid leave
    let user;
    let renewal;
    let consumedElement;

    beforeEach(function(done) {
        helpers.mockServer('consumptionHistorySpecTestDatabase', function(_mockServer) {
            server = _mockServer;

            done();
        });
    });




    it('verify getConsuptionHistory function', function(done) {

        let dtstart = new Date(2016,3,11,8,0,0,0);
        let dtend = new Date(2016,3,11,17,0,0,0);

        api.user.createRandomAccountRequest(server.app, {
                name: 'test getConsuptionHistory'
            }, {
                name: 'test getConsuptionHistory',
                type: type
            },
            dtstart,
            dtend,
            1
        )
        .then(o => {
            user = o.randomUser.user;
            renewal = o.elem.right.renewal.id;
            return consumptionHistory.getConsuptionHistory(user, [type])
            .then(history => {
                expect(history.length).toEqual(1);
                consumedElement = history[0];
                done();
            });

        }).catch(done);
    });


    it('verify getConsumedQuantityBetween function', function(done) {

        let periods = [
            {
                dtstart: new Date(2016,3,10,0,0,0,0),
                dtend: new Date(2016,3,12,0,0,0,0)
            }
        ];

        let RightRenewal = server.app.db.models.RightRenewal;

        RightRenewal.findOne({ _id: renewal })
        .exec()
        .then(renewal => {
            return consumptionHistory.getConsumedQuantityBetween(user, [type], periods, 'D', renewal, 24)
            .then(total => {
                expect(total).toEqual(consumedElement.consumedQuantity);
                done();
            });
        })
        .catch(done);
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
