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

    beforeEach(function(done) {
        helpers.mockServer('consuptionHistorySpecTestDatabase', function(_mockServer) {
            server = _mockServer;

            done();
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
        )
        .then(o => {
            consuptionHistory.getConsuptionHistory(o.randomUser.user, [type])
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
