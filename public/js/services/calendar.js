define([], function() {

    'use strict';


    return function loadCalendarService(gettext) {


        return {


            /**
             * @param {int} year
             * @param {int} month
             * @return {Object}
             */
            createNavigation: function(year, month) {

                var nbWeeks = 52;
                var nav = {};

                var loopDate = new Date(year, month, 1);
                var endDate = new Date(loopDate);
                endDate.setDate(endDate.getDate()+(7*nbWeeks));

                while (loopDate < endDate) {

                    var yearprop = 'year'+loopDate.getFullYear();
                    var monthprop = 'month'+loopDate.getMonth();

                    if (undefined === nav[yearprop]) {
                        nav[yearprop] = {
                            y: loopDate.getFullYear(),
                            months: {}
                        };
                    }

                    if (undefined === nav[yearprop][monthprop]) {

                        var label;

                        try {
                            label = loopDate.toLocaleDateString('month');
                        } catch (e) {
                            label = loopDate.getMonth()+1;
                        }

                        nav[yearprop].months[monthprop] = {
                            m: loopDate.getMonth(),
                            label: label
                        };
                    }

                    loopDate.setMonth(loopDate.getMonth()+1);
                }

                return nav;
            }
        };
    };

});
