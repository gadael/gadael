'use strict';

let helpers = require('./mockDatabase');
let api = {
    user: require('../../../api/User.api'),
    request: require('../../../api/Request.api'),
    right: require('../../../api/Right.api')
};

describe('Right consumption', function() {

    let app;
    let userModel, rightModel;
    let userDocument, collectionDocument;

    beforeEach(function(done) {
        helpers.mockDatabase('rightConsumptionSpec', function(mockapp) {
            app = mockapp;

            userModel = app.db.models.User;
            rightModel = app.db.models.Right;

            done();
        });
    });

    it('create a random test account', function(done) {
        api.user.createRandomAccount(app).then(randomUser => {
            userDocument = randomUser.user;
            api.right.addTestRight(app, userDocument).then(collection => {
                collectionDocument = collection;
                done();
            }).catch(err => {
                console.log(err);
                expect(err).toBeNull();
                done();
            });

        }).catch(err => {
            console.log(err);
            expect(err).toBeNull();
            done();
        });

    });


    it('create a random request', function(done) {
        userDocument.populate('roles.account', (err) => {

            if (err) {
                console.log(err);
                return done();
            }

            api.request.createRandomAbsence(app, userDocument).then(o => {
                console.log(o);
                done();
            }).catch(err => {
                console.log(err);
                expect(err).toBeNull();
                done();
            });
        });

    });



    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightConsumptionSpec', done);
        });
	});


});
