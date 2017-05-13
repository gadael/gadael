/*global describe: false, it: false */

var assert = require('assert');
var jurassic = require('../src/jurassic');



describe('Period', function () {

    'use strict';

    function getHPeriod(start, end)
    {
        var period = new jurassic.Period();
        period.dtstart = new Date();
        period.dtstart.setHours(start, 0, 0, 0);
        period.dtend = new Date();
        period.dtend.setHours(end, 0, 0, 0);

        return period;
    }


    describe('getBusinessDays()', function () {


        it('get duration on one day period', function () {
            assert.equal(1, getHPeriod(8, 18).getBusinessDays());
        });

        it('get duration on morning period', function () {
            assert.equal(0.5, getHPeriod(8, 12).getBusinessDays());
        });

        it('get duration on afternoon period', function () {
            assert.equal(0.5, getHPeriod(12, 18).getBusinessDays());
        });

        it('get duration on one hour period over a specified half-day', function () {
            var halfday = new Date();
            halfday.setHours(11, 30, 0, 0);
            assert.equal(1, getHPeriod(11, 12).getBusinessDays(halfday));
        });

        it('get duration on two days period', function () {
            var period = getHPeriod(8, 18);
            period.dtend.setDate(period.dtend.getDate() +1);
            assert.equal(2, period.getBusinessDays());
        });

        it('get duration on two days and a half period', function () {
            var period = getHPeriod(8, 12);
            period.dtend.setDate(period.dtend.getDate() +2);
            assert.equal(2.5, period.getBusinessDays());
        });

        it('get days on two days and a half period', function () {
            var period = getHPeriod(8, 12);
            period.dtend.setDate(period.dtend.getDate() +2);
            assert.equal(3, Object.keys(period.getDays()).length);
        });
    });
});
