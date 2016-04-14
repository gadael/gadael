'use strict';

let helpers = require('./mockDatabase');
let api = {
    user: require('../../../api/User.api'),
    request: require('../../../api/Request.api'),
    right: require('../../../api/Right.api')
};

describe('Right consumption', function() {

    let app;

    beforeEach(function(done) {
        helpers.mockDatabase('rightConsumptionSpec', function(mockapp) {
            app = mockapp;

            done();
        });
    });


    it('verify default consuption type', function(done) {
        api.user.createRandomAccountRequest(app, {
            name: 'default consuption'
        }, {
            name: 'default consuption'
        }).then(elem => {
            expect(elem.quantity).toEqual(1);
            expect(elem.consumedQuantity).toEqual(elem.quantity);
            done();
        }).catch(done);
    });


    it('verify proportion consuption type with 100% attendance', function(done) {
        api.user.createRandomAccountRequest(app, {
            name: 'proportion 100',
            attendance: 100
        }, {
            name: 'proportion 100',
            consuption: 'proportion'
        }).then(elem => {
            expect(elem.quantity).toEqual(1);
            expect(elem.consumedQuantity).toEqual(1);
            done();
        }).catch(done);
    });


    it('verify proportion consuption type with 50% attendance', function(done) {
        api.user.createRandomAccountRequest(app, {
            name: 'proportion 50',
            attendance: 50
        }, {
            name: 'proportion 50',
            consuption: 'proportion'
        }).then(elem => {
            expect(elem.quantity).toEqual(1);
            expect(elem.consumedQuantity).toEqual(2);
            done();
        }).catch(err => {
            done(err);
            console.log(err.stack);
            console.log(err.errors);
        });
    });


    it('verify proportion consuption type with 75% attendance', function(done) {
        api.user.createRandomAccountRequest(app, {
            name: 'proportion 75',
            attendance: 75
        }, {
            name: 'proportion 75',
            consuption: 'proportion'
        }).then(elem => {
            expect(elem.quantity).toEqual(1);
            expect(elem.consumedQuantity).toBeCloseTo(1.333);
            done();
        }).catch(err => {
            done(err);
            console.log(err.stack);
            console.log(err.errors);
        });
    });



    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightConsumptionSpec', done);
        });
	});


});
