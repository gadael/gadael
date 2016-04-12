'use strict';

let helpers = require('./mockDatabase');
let api = {
    user: require('../../../api/User.api'),
    request: require('../../../api/Request.api')
};

describe('Right consumption', function() {

    let app;
    let userModel, rightModel;
    let userDocument;

    beforeEach(function(done) {
        helpers.mockDatabase('rightConsumptionSpec', function(mockapp) {
            app = mockapp;

            userModel = app.db.models.User;
            rightModel = app.db.models.Right;

            done();
        });
    });

    it('create a random test account', function(done) {
        api.user.createRandomAccount(app).then(user => {
            userDocument = user;
            done();
        });

    });


    it('create a right without monthly adjustment', function(done) {
        var right = new rightModel();

        right.name = 'Preliminary test right';
        right.quantity = 10;
        right.quantity_unit = 'D';
        right.addMonthly = {
            quantity: null
        };

        right.save(function(err, right) {
            expect(err).toBeNull();
            if (err) {
                return done();
            }

        });
    });



    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightConsumptionSpec', done);
        });
	});


});
