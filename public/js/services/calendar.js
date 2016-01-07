define([], function() {

    'use strict';


    return function loadCalendarService(gettext, $locale) {


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
            createNavigation: function(year, month) {

                var nbWeeks = 100;
                var nav = {
                    years: [],
                    keys: {}
                };

                var loopDate = new Date(year, month -6, 1);
                var endDate = new Date(loopDate);
                endDate.setDate(endDate.getDate()+(7*nbWeeks));

                addToNav(nav, loopDate, endDate);

                console.log(nav);

                return nav;
            },

            /**
             * update nav object with number of weeks
             * @param {Object} nav
             * @param {Integer} nbWeeks
             */
            addNavigation: function(nav, nbWeeks) {

                var ykey = nav.years.length - 1;
                var lastyear = nav.years[ykey].y;
                var mkey = nav.years[ykey].months.length - 1;
                var lastmonth = nav.years[ykey].months[mkey].m;

                var loopDate = new Date(lastyear, lastmonth +1, 1);
                var endDate = new Date(loopDate);
                endDate.setDate(endDate.getDate()+(7*nbWeeks));

                addToNav(nav, loopDate, endDate);
            }
        };
    };

});
