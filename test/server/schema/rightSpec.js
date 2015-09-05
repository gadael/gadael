'use strict';

var helpers = require('./mockDatabase');


describe('Right model', function() {

    var app;
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


    it('update adjustment if renewal is modified with less months', function(done) {
        renewal1.finish.setMonth(renewal1.finish.getMonth()-2);
        renewal1.save(function(err, renewal) {
            expect(err).toEqual(null);
            expect(renewal).toBeDefined();
            if (renewal) {
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(10);
            }
            done();
        });
    });


    it('update adjustment if renewal is modified with more months', function(done) {
        renewal1.finish.setMonth(renewal1.finish.getMonth()+4);
        renewal1.save(function(err, renewal) {
            expect(err).toEqual(null);
            expect(renewal).toBeDefined();
            if (renewal) {
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(14);
            }
            done();
        });
    });


    it("should disconnect from the database", function(done) {
        app.disconnect(function() {
            // and delete the test db
            helpers.dropDb('rightSpec', done);
        });
	});


});
