'use strict';

var helpers = require('./mockDatabase');
var app;

describe('User model', function() {


    var rightModel, rightRenewalModel;
    var right1;
    var renewal1;

    beforeEach(function(done) {
        helpers.mockDatabase('rightSpec', function(mockapp) {
            app = mockapp;

            rightModel = app.db.models.Right;
            rightRenewalModel = app.db.models.RightRenewal;

            done();
        });
    });


    it('create a right with monthly adjustment', function(done) {
        var right = new rightModel();

        right.name = 'Test right';
        right.quantity = 10;
        right.quantity_unit = 'D';
        right.addMonthly = {
            quantity: 1
        };

        right.save(function(err, right) {
            expect(err).toBeNull();
            if (err) {
                return done();
            }

            right1 = right;

            // because there is no end date set:


            var renewal = new rightRenewalModel();

            renewal.right = right1._id;
            renewal.start = new Date();
            renewal.finish = new Date(renewal.start);
            renewal.finish.setFullYear(renewal.finish.getFullYear()+1);

            renewal.save(function(err, renewal) {
                expect(err).toBeNull();
                renewal1 = renewal;
                expect(renewal1.adjustments).toBeDefined();
                expect(renewal1.adjustments.length).toEqual(12);
                done();
            });
        });
    });


    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightSpec', done);
        });
	});


});
