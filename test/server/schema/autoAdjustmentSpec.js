'use strict';

let helpers = require('./mockDatabase');
let api = {
    user: require('../../../api/User.api'),
    request: require('../../../api/Request.api'),
    right: require('../../../api/Right.api')
};

describe('Auto adjustment', function() {

    let app, sick, rtt;


    beforeEach(function(done) {
        helpers.mockDatabase('rightAutoAdjustmentSpec', function(mockapp) {
            app = mockapp;
            done();
        });
    });

    it('create sick leave right', function(done) {
        api.right.createRight(app, {
            name: 'Sick leave'
        })
        .then(right => {
            sick = right;
            done();
        })
        .catch(done);
    });

    it('create right with auto adjustment from sick leave', function(done) {
        api.right.createRight(app, {
            name: 'RTT'
        })
        .then(right => {
            rtt = right;
            done();
        })
        .catch(done);

    });


    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightConsumptionSpec', done);
        });
	});


});
