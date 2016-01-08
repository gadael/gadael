define(['moment'], function(moment) {

    'use strict';


    return function loadCalendarService(gettext, $locale) {

        /**
         * Add weeks lines to calendar
         */
        function addToCalendar(calendar, loopDate, endDate)
        {
            var weekprop, id, lastid, monthid;

            while (loopDate < endDate) {

                weekprop = moment(loopDate).format('GGGGW');

                if (undefined === calendar.keys[weekprop]) {

                    id = null;
                    lastid = null;

                    if (calendar.weeks.length > 0) {
                        lastid = calendar.weeks[calendar.weeks.length -1].id;
                    }

                    monthid = 'month'+moment(loopDate).format('YYYYM');

                    if (lastid !== monthid) {
                        id = monthid;
                    }


                    calendar.weeks.push({
                        label: moment(loopDate).format('WW'),
                        days: [],
                        id: id
                    });

                    calendar.keys[weekprop] = calendar.weeks.length-1;
                }

                var weekkey = calendar.keys[weekprop];

                calendar.weeks[weekkey].days.push({
                    label: loopDate.getDate(),
                    d: new Date(loopDate)
                });

                loopDate.setDate(loopDate.getDate()+1);
            }
        }




        /**
         * Add months lines to left navigation
         */
        function addToNav(nav, loopDate, endDate)
        {
            while (loopDate < endDate) {


                var yearprop = loopDate.getFullYear();
                var monthprop = loopDate.getMonth();

                if (undefined === nav.keys[yearprop]) {
                    nav.years.push({
                        y: loopDate.getFullYear(),
                        months: [],
                        keys: {}
                    });

                    nav.keys[yearprop] = nav.years.length -1;
                }

                var yearkey = nav.keys[yearprop];

                if (undefined === nav.years[yearkey].keys[monthprop]) {

                    var label;

                    try {
                        label = loopDate.toLocaleDateString($locale.id, { month: 'long' });
                    } catch (e) {
                        label = loopDate.getMonth()+1;
                    }

                    nav.years[yearkey].months.push({
                        m: loopDate.getMonth(),
                        label: label
                    });

                    nav.years[yearkey].keys[monthprop] = nav.years[yearkey].months.length - 1;
                }

                loopDate.setMonth(loopDate.getMonth()+1);
            }
        }


        return {



            /**
             * @param {int} year
             * @param {int} month
             * @return {Object}
             */
            createCalendar: function(year, month) {

                var nbWeeks = 100;
                var cal = {
                    calendar: {
                        weeks: [],
                        keys: {}
                    },
                    nav: {
                        years: [],
                        keys: {}
                    }
                };

                var loopDate = new Date(year, month -6, 1);
                var endDate = new Date(loopDate);
                endDate.setDate(endDate.getDate()+(7*nbWeeks));

                addToCalendar(cal.calendar, new Date(loopDate), endDate);
                addToNav(cal.nav, new Date(loopDate), endDate);

                return cal;
            },

            /**
             * update nav object with number of weeks
             * @param {Object} cal
             * @param {Integer} nbWeeks
             */
            addWeeks: function(cal, nbWeeks) {

                var calendar = cal.calendar;
                var nav = cal.nav;

                var ykey = nav.years.length - 1;
                var lastyear = nav.years[ykey].y;
                var mkey = nav.years[ykey].months.length - 1;
                var lastmonth = nav.years[ykey].months[mkey].m;

                var loopDate = new Date(lastyear, lastmonth +1, 1);
                var endDate = new Date(loopDate);
                endDate.setDate(endDate.getDate()+(7*nbWeeks));

                addToCalendar(calendar, new Date(loopDate), endDate);
                addToNav(nav, new Date(loopDate), endDate);
            }
        };
    };

});
