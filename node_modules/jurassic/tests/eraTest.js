/*global describe: false, it: false */

'use strict';

var assert = require('assert');
var jurassic = require('../src/jurassic');


function getLargeEra()
{
    var large = new jurassic.Era();

    function addDay(day) {
        var am = {
            dtstart: new Date(day),
            dtend: new Date(day)
        };

        var pm = {
            dtstart: new Date(day),
            dtend: new Date(day)
        };

        am.dtstart.setHours(8);
        am.dtend.setHours(12);

        pm.dtstart.setHours(14);
        pm.dtend.setHours(18);

        large.addPeriod(am);
        large.addPeriod(pm);
    }


    var day = new Date(2015,0,1);


    for(var i=0; i<100; i++) {
        addDay(day);
        day.setDate(1+day.getDate());
    }

    return large;
}


describe('Era', function() {



    describe('addPeriod()', function() {


        it('add one boundary set for two similar dates', function() {

            var era, p1, p2;

            era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 7);
            p2.dtend = new Date(2015, 1, 8);

            era.addPeriod(p1);
            era.addPeriod(p2);

            assert.equal(3, era.boundaries.length);
            assert.equal(1, era.boundaries[0].rootDate.getDate());
            assert.equal(7, era.boundaries[1].rootDate.getDate());
            assert.equal(8, era.boundaries[2].rootDate.getDate());
        });



        it('add two boundaries', function() {

            var era, p1, p2;

            era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2, 7, 0, 0);
            p1.dtend = new Date(2015, 1, 2, 9, 0, 1);

            era.addPeriod(p1);

            assert.equal(2, era.boundaries.length);
            assert.equal(0, era.boundaries[0].rootDate.getSeconds());
            assert.equal(1, era.boundaries[1].rootDate.getSeconds());
        });


        it('is fluent', function() {

            var era, p1, p2;
            era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 7);
            p2.dtend = new Date(2015, 1, 8);

            era.addPeriod(p1).addPeriod(p2);

            assert.equal(3, era.boundaries.length);
            assert.equal(1, era.boundaries[0].rootDate.getDate());
            assert.equal(7, era.boundaries[1].rootDate.getDate());
            assert.equal(8, era.boundaries[2].rootDate.getDate());
        });


        it('add period from object', function() {
            var era = new jurassic.Era();
            era.addPeriod({
                dtstart: new Date(2015, 1, 1),
                dtend: new Date(2015, 1, 7),
                summary: 'test'
            });

            assert.equal(1, era.periods.length);
            assert.equal(true, era.periods[0] instanceof jurassic.Period);
            assert.equal('test', era.periods[0].summary);
        });


        it('add period from object with string dates', function() {
            var era = new jurassic.Era();
            era.addPeriod({
                dtstart: 'Sun Mar 29 2015 00:00:00 GMT+0100 (CET)',
                dtend: 'Sun Mar 29 2015 08:00:00 GMT+0100 (CET)',
                summary: 'test'
            });

            assert.equal(1, era.periods.length);
            assert.equal(true, era.periods[0] instanceof jurassic.Period);
            assert.equal('test', era.periods[0].summary);
            assert.equal(true, era.periods[0].dtstart instanceof Date);
            assert.equal(true, era.periods[0].dtend instanceof Date);
        });




        it('with an invalid period', function() {
            var era1, p1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2, 6, 30);
            p1.dtend = new Date(2015, 1, 2, 6, 30);

            assert.throws(function() {
                era1.addPeriod(p1);
            }, Error);
        });
    });


    describe('getFlattenedEra()', function() {

        it('Flatten overlapped periods', function() {
            var era, p1, p2, flattenedEra;

            era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 6);
            p2.dtend = new Date(2015, 1, 8);

            era.addPeriod(p1);
            era.addPeriod(p2);

            assert.equal(2, era.periods.length);

            flattenedEra = era.getFlattenedEra(true);

            assert.equal(1, flattenedEra.periods.length);
            assert.equal(2, era.periods.length);

            var period = flattenedEra.periods[0];

            assert.equal(1, period.dtstart.getDate());
            assert.equal(8, period.dtend.getDate());
            assert.equal(2, period.events.length);
        });


        it('Merge sibblings periods', function() {

            var era, p1, p2;

            era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1, 0, 0, 0);
            p1.dtend = new Date(2015, 1, 7, 5, 4, 30);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 7, 5, 4, 30);
            p2.dtend = new Date(2015, 1, 8, 0, 0, 0);

            era.addPeriod(p1);
            era.addPeriod(p2);

            assert.equal(2, era.periods.length);

            var flattenedEra = era.getFlattenedEra();

            assert.equal(1, flattenedEra.periods.length);

            var period = flattenedEra.periods[0];

            assert.equal(1, period.dtstart.getDate());
            assert.equal(8, period.dtend.getDate());
        });


        it('Does nothing if no intersections', function() {
            var largeEra = getLargeEra();
            var flattendedEra = largeEra.getFlattenedEra();
            assert.equal(200, largeEra.periods.length);
            assert.equal(200, flattendedEra.periods.length);
        });

        it('Flatten periods in large era', function() {
            var largeEra = getLargeEra();
            largeEra.addPeriod({
                dtstart: new Date(2015,0,15,0,0,0),
                dtend: new Date(2015,0,16,8,0,0)
            });

            var flattenedEra = largeEra.getFlattenedEra();

            assert.equal(198, flattenedEra.periods.length);
            assert.equal(201, largeEra.periods.length);
        });

    });


    describe('getEraWithoutPeriod()', function() {


        it('substract period with days', function() {
            var p1, p2, p3, newEra1, newEra2, era = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 6);

            p3 = new jurassic.Period();
            p3.dtstart = new Date(2015, 1, 6);
            p3.dtend = new Date(2015, 1, 7);

            era.addPeriod(p1);
            newEra1 = era.getEraWithoutPeriod(p2);
            assert.equal(2, newEra1.periods.length);
            assert.equal(5, newEra1.periods[0].dtend.getDate());
            assert.equal(6, newEra1.periods[1].dtstart.getDate());

            newEra2 = era.getEraWithoutPeriod(p3);
            assert.equal(1, newEra2.periods.length);
            assert.equal(2, newEra2.boundaries.length);
        });


    });


    describe('subtractPeriod()', function() {

        it('with one period inside the other', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 6);

            era1.addPeriod(p1);

            era1.subtractPeriod(p2);

            assert.equal(2, era1.periods.length);
            assert.equal(5, era1.periods[0].dtend.getDate());
            assert.equal(6, era1.periods[1].dtstart.getDate());
            assert.equal(4, era1.boundaries.length);


        });

        it('with a period overlapping the other on left', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 5);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 1);
            p2.dtend = new Date(2015, 1, 6);

            era1.addPeriod(p1);

            era1.subtractPeriod(p2);
            assert.equal(1, era1.periods.length);
            assert.equal(6, era1.periods[0].dtstart.getDate());
            assert.equal(2, era1.boundaries.length);
        });

        it('with a period overlapping the other on right', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 6);
            p2.dtend = new Date(2015, 1, 10);

            era1.addPeriod(p1);

            era1.subtractPeriod(p2);
            assert.equal(1, era1.periods.length);
            assert.equal(6, era1.periods[0].dtend.getDate());
            assert.equal(2, era1.boundaries.length);
        });


        it('with an external period', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 15);
            p2.dtend = new Date(2015, 1, 16);

            era1.addPeriod(p1);

            era1.subtractPeriod(p2);
            assert.equal(1, era1.periods.length);
            assert.equal(2, era1.boundaries.length);
        });


        it('with an invalid period', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2, 5, 30);
            p1.dtend = new Date(2015, 1, 7, 19, 30);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 2, 6, 30);
            p2.dtend = new Date(2015, 1, 2, 6, 30);

            era1.addPeriod(p1);

            assert.throws(function() {
                era1.subtractPeriod(p2);
            }, Error);
        });


        it('with a period cover the other', function() {
            var era1, p1, p2, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 1);
            p2.dtend = new Date(2015, 1, 10);

            era1.addPeriod(p1);

            era1.subtractPeriod(p2);
            assert.equal(0, era1.periods.length);
            assert.equal(0, era1.boundaries.length);
        });


        it('with a period covering two others', function() {
            var era1, p1, p2, p3, newEra1;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 3);
            p1.dtend = new Date(2015, 1, 4);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 1);
            p2.dtend = new Date(2015, 1, 12);

            p3 = new jurassic.Period();
            p3.dtstart = new Date(2015, 1, 1);
            p3.dtend = new Date(2015, 1, 15);

            era1.addPeriod(p1);
            era1.addPeriod(p2);

            era1.subtractPeriod(p3);
            assert.equal(0, era1.periods.length);
            assert.equal(0, era1.boundaries.length);
        });


        it('2 equals periods', function() {
            var era1, p1, p2;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 3, 8);
            p1.dtend = new Date(2015, 1, 3, 18);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 3, 8);
            p2.dtend = new Date(2015, 1, 3, 18);


            era1.addPeriod(p1);

            era1.subtractPeriod(p2);
            assert.equal(0, era1.periods.length);
            assert.equal(0, era1.boundaries.length);
        });





        it('subtract on two periods with seconds', function() {
            var era1 = new jurassic.Era(),
                p1,
                p2,
                p3;

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2, 7, 0, 0);
            p1.dtend = new Date(2015, 1, 2, 9, 0, 1);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 2, 6, 0, 0);
            p2.dtend = new Date(2015, 1, 2, 10, 30, 0);

            p3 = new jurassic.Period();
            p3.dtstart = new Date(2015, 1, 2, 8, 0, 0);
            p3.dtend = new Date(2015, 1, 2, 9, 0, 0);



            era1.addPeriod(p1);
            era1.addPeriod(p2);


            era1.subtractPeriod(p3);


            assert.equal(4, era1.periods.length);
            assert.equal(6, era1.boundaries.length); // two common boundary at 08:00:00 and 09:00:00
        });



        it('two consecutive subtract on one day', function() {
            var era1, p1, p2, p3, p4, p5;

            era1 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 15);
            p1.dtend = new Date(2015, 1, 16);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 15, 8);
            p2.dtend = new Date(2015, 1, 15, 12);

            p3 = new jurassic.Period();
            p3.dtstart = new Date(2015, 1, 15, 14);
            p3.dtend = new Date(2015, 1, 15, 18);

            p4 = new jurassic.Period();
            p4.dtstart = new Date(2015, 1, 16, 8);
            p4.dtend = new Date(2015, 1, 16, 12);

            p5 = new jurassic.Period();
            p5.dtstart = new Date(2015, 1, 14, 14);
            p5.dtend = new Date(2015, 1, 14, 18);

            era1.addPeriod(p1);

            era1.subtractPeriod(p5); // ignored
            era1.subtractPeriod(p2);
            era1.subtractPeriod(p3);
            era1.subtractPeriod(p4); // ignored
            assert.equal(3, era1.periods.length);
            assert.equal(6, era1.boundaries.length);
        });

    });


    describe('subtractEra()', function() {

        it('substract era with one period', function() {
            var era1, era2, p1, p2, newEra1;

            era1 = new jurassic.Era();
            era2 = new jurassic.Era();

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 6);

            era1.addPeriod(p1);
            era2.addPeriod(p2);

            newEra1 = era1.subtractEra(era2);
            assert.equal(2, newEra1.periods.length);
        });


        it('substract era with 2 periods on hours', function() {
            var era1 = new jurassic.Era(),
                era2 = new jurassic.Era(),
                p1,
                p2,
                p3,
                p4;

            p1 = new jurassic.Period();
            p1.dtstart = new Date(2015, 1, 2, 7, 0, 0);
            p1.dtend = new Date(2015, 1, 2, 9, 0, 1);


            p2 = new jurassic.Period();
            p2.dtstart = new Date(2015, 1, 2, 6, 0, 0);
            p2.dtend = new Date(2015, 1, 2, 10, 30, 0);

            p3 = new jurassic.Period();
            p3.dtstart = new Date(2015, 1, 2, 8, 0, 0);
            p3.dtend = new Date(2015, 1, 2, 9, 0, 0);

            p4 = new jurassic.Period();
            p4.dtstart = new Date(2015, 1, 2, 10, 0, 0);
            p4.dtend = new Date(2015, 1, 2, 10, 10, 0);


            era1.addPeriod(p1);
            era1.addPeriod(p2);
            era2.addPeriod(p3);
            era2.addPeriod(p4);

            assert.equal(5, era1.subtractEra(era2).periods.length);
        });


        it('substract era with overlapped periods', function() {
            var era1 = new jurassic.Era(),
                era2 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p3 = new jurassic.Period(),
                p4 = new jurassic.Period(),
                newEra;

            p1.dtstart = new Date(2015, 1, 2, 7, 0, 0);
            p1.dtend = new Date(2015, 1, 2, 9, 0, 1);

            p3.dtstart = new Date(2015, 1, 2, 8, 0, 0);
            p3.dtend = new Date(2015, 1, 2, 9, 0, 0);

            p4.dtstart = new Date(2015, 1, 2, 8, 30, 0);
            p4.dtend = new Date(2015, 1, 2, 10, 10, 0);


            era1.addPeriod(p1);
            era2.addPeriod(p3);
            era2.addPeriod(p4);

            newEra = era1.subtractEra(era2);
            assert.equal(1, newEra.periods.length);
            assert.equal(8, newEra.periods[0].dtend.getHours());
            assert.equal(0, newEra.periods[0].dtend.getMinutes());
        });


        it('substract era with working hours, get unavailable hours on one day', function() {
            var unavailableEra = new jurassic.Era();
            unavailableEra.addPeriod({
                dtstart: new Date(2015,0,5),
                dtend: new Date(2015,0,6)
            });
            var newEra = unavailableEra.subtractEra(getLargeEra());

            /*
            newEra.periods.forEach(function(event) {
                console.log(event.dtstart.getDate()+' '+event.dtstart.getHours()+'H -> '+event.dtend.getDate()+' '+event.dtend.getHours()+'H');
            });
            */
            assert.equal(3, newEra.periods.length);

        });



        it('substract era on large amount of periods, for work on speed optimizations', function() {
            var unavailableEra = new jurassic.Era();
            unavailableEra.addPeriod({
                dtstart: new Date(2015,0,1),
                dtend: new Date(2016,0,1)
            });
            var newEra = unavailableEra.subtractEra(getLargeEra());

            assert.equal(201, newEra.periods.length);
        });



    });


    describe('intersectPeriod()', function() {

        it('intersect overlapped periods, without copy of properties', function() {
            var era1 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p2 = new jurassic.Period(),
                era2;

            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);
            p1.summary = 'My custom event';

            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 8);
            p2.summary = 'and another one';

            era1.addPeriod(p1);
            era2 = era1.intersectPeriod(p2, false);

            assert.equal(1, era2.periods.length);
            assert.equal(5, era2.periods[0].dtstart.getDate());
            assert.equal(7, era2.periods[0].dtend.getDate());
            assert.equal(undefined, era2.periods[0].summary);
        });


        it('intersect overlapped periods, properties from the main era must be preserved', function() {
            var era1 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p2 = new jurassic.Period(),
                era2;

            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);
            p1.summary = 'My custom event';

            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 8);
            p2.summary = 'and another one';

            era1.addPeriod(p1);
            era2 = era1.intersectPeriod(p2, true);

            assert.equal(1, era2.periods.length);
            assert.equal(5, era2.periods[0].dtstart.getDate());
            assert.equal(7, era2.periods[0].dtend.getDate());
            assert.equal('My custom event', era2.periods[0].summary);
        });
    });







    describe('intersectEra()', function() {

        it('intersect overlapped periods', function() {
            var era1 = new jurassic.Era(),
                era2 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p2 = new jurassic.Period(),
                p3 = new jurassic.Period(),
                p4 = new jurassic.Period(),
                intersection;

            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 4);

            p2.dtstart = new Date(2015, 1, 5);
            p2.dtend = new Date(2015, 1, 8);

            p3.dtstart = new Date(2015, 1, 2);
            p3.dtend = new Date(2015, 1, 3);

            p4.dtstart = new Date(2015, 1, 4);
            p4.dtend = new Date(2015, 1, 6);


            era1.addPeriod(p1).addPeriod(p2);
            era2.addPeriod(p3).addPeriod(p4);

            intersection = era1.intersectEra(era2);

            assert.equal(2, intersection.periods.length);
            assert.equal(2, intersection.periods[0].dtstart.getDate());
            assert.equal(3, intersection.periods[0].dtend.getDate());
            assert.equal(5, intersection.periods[1].dtstart.getDate());
            assert.equal(6, intersection.periods[1].dtend.getDate());
        });
    });


    describe('removePeriod()', function() {

        it('Remove period by dates', function() {
            var era1 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p2 = new jurassic.Period();

            p1.dtstart = new Date(2015, 1, 1);
            p1.dtend = new Date(2015, 1, 7);

            p2.dtstart = new Date(2015, 1, 1);
            p2.dtend = new Date(2015, 1, 7);

            era1.addPeriod(p1);
            era1.removePeriod(p2);

            assert.equal(0, era1.periods.length);
            assert.equal(0, era1.boundaries.length);
        });
    });



    describe('getDays()', function() {

        it('Sum of 3 periods', function() {
            var era1 = new jurassic.Era(),
                p1 = new jurassic.Period(),
                p2 = new jurassic.Period(),
                p3 = new jurassic.Period();

            p1.dtstart = new Date(2015, 1, 1, 8,0,0,0);
            p1.dtend = new Date(2015, 1, 2, 18,0,0,0);

            p2.dtstart = new Date(2015, 1, 5, 14,0,0,0);
            p2.dtend = new Date(2015, 1, 5, 18,0,0,0);

            p3.dtstart = new Date(2015, 1, 5, 19,0,0,0);
            p3.dtend = new Date(2015, 1, 5, 20,0,0,0);

            era1.addPeriod(p1);
            era1.addPeriod(p2);
            era1.addPeriod(p2);

            assert.equal(3, Object.keys(era1.getDays()).length);
        });
    });


});
