'use strict';


const helpers = require('../rest/mockServer');
const mongoose = require('mongoose');

const api = {
    company: require('../../../api/Company.api.js'),
    user: require('../../../api/User.api.js'),
    request: require('../../../api/Request.api')
};

const consuptionHistory = require('../../../modules/consuptionHistory');


describe('Consuption history module', function() {

    let server;
    let ObjectId = mongoose.Types.ObjectId;
    let type = new ObjectId('5740adf51cf1a569643cc508');
    let user;
    let consumedElement;

    beforeEach(function(done) {
        helpers.mockServer('consuptionHistorySpecTestDatabase', function(_mockServer) {
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
            return consuptionHistory.getConsuptionHistory(user, [type])
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

        consuptionHistory.getConsumedQuantityBetween(user, [type], periods, 'D')
        .then(total => {
            expect(total).toEqual(consumedElement.consumedQuantity);
            done();
        })
        .catch(done);
    });


    it('close the mock server', function(done) {
        server.close(done);
    });


});
