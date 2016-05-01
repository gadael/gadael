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

            var renewal = new rightRenewalModel();

            renewal.right = right._id;
            renewal.start = new Date();
            renewal.finish = new Date(renewal.start);
            renewal.finish.setFullYear(renewal.finish.getFullYear()+1);

            renewal.save(function(err, renewal) {
                expect(err).toBeNull();
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(0);
                done();
            });
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
            renewal.start.setDate(15);
            renewal.start.setHours(0,0,0,0);
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





    it('create a right with monthly adjustment the first day of a month (last adjustement date = renewal finish date)', function(done) {
        var right = new rightModel();

        right.name = 'Test right 2';
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

            var renewal = new rightRenewalModel();

            renewal.right = right._id;
            renewal.start = new Date();
            renewal.start.setDate(1);
            renewal.start.setHours(0,0,0,0);
            renewal.finish = new Date(renewal.start);
            renewal.finish.setFullYear(renewal.finish.getFullYear()+1);

            renewal.save(function(err, renewal) {
                expect(err).toBeNull();
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(12);
                done();
            });
        });
    });







    it('update adjustments if renewal is modified with less months', function(done) {
        renewal1.finish.setMonth(renewal1.finish.getMonth()-2);
        renewal1.markModified('finish');
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


    it('test getLastRenewal', function(done) {
        right1.getLastRenewal().then(function(renewal) {
            expect(renewal.adjustments.length).toEqual(10);
            expect(renewal.finish).toEqual(renewal1.finish);
            done();
        });
    });



    it('update adjustments if renewal is modified with more months', function(done) {
        renewal1.finish.setMonth(renewal1.finish.getMonth()+4);
        renewal1.markModified('finish');
        renewal1.save(function(err, renewal) {
            expect(err).toEqual(null);
            expect(renewal).toBeDefined();
            if (renewal) {
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(14);
                expect(renewal.finish).toEqual(renewal1.finish);
            }
            done();
        });
    });





    it('test getAllRenewal', function(done) {
        right1.getAllRenewals().then(function(arr) {
            expect(arr[0].adjustments.length).toEqual(14);
            expect(arr[0].finish).toEqual(renewal1.finish);
            done();
        });
    });


    it('update adjustments if right.addMonthly.quantity is modified', function(done) {

        right1.addMonthly.quantity = 2;
        right1.save(function(err, right) {
            right.getLastRenewal().then(function(renewal) {
                expect(renewal).toBeDefined();
                expect(renewal._id.toString()).toEqual(renewal1._id.toString());
                expect(renewal.finish).toEqual(renewal1.finish);
                expect(renewal.adjustments).toBeDefined();
                expect(renewal.adjustments.length).toEqual(14);

                var adjustment = renewal.adjustments[renewal.adjustments.length -1];
                expect(adjustment.quantity).toEqual(2);
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
