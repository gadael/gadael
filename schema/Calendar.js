'use strict';

const ical = require('ical');
const util = require('util');
const latinize = require('latinize');
const periodCriterion = require('../modules/periodcriterion');

/**
 * Source URL for non-working day ICS file or workshedules ICS file
 *
 * The events in CalendarEvent schema will be delete and recreated according to the ics source file
 * the past events will never be modified
 *
 * @see http://www.calconnect.org/tests/iCalendar-RRULE-Interop/iCalendar-RRULE-Interop-Matrix.html
 */
exports = module.exports = function(params) {

	const mongoose = params.mongoose;

    var defaultHalfDay = new Date();
    defaultHalfDay.setHours(12,0,0);

	var calendarSchema = new params.mongoose.Schema({
		name: { type: String, required: true },
		url: { type: String, required: true },
		type: { type: String, enum:['workschedule', 'nonworkingday', 'holiday'], required: true },
		lastUpdate: { type: Date }, // date for last copy of events from ics to database
		timeCreated: { type: Date, default: Date.now },

		// used for the default ics embeded in the app
		locked: { type: Boolean, default: false },

        halfDayHour: { type: Date, default: defaultHalfDay }, // for workschedule

        hoursPerDay: Number, // average hours per day for a workschedule

		userCreated: { // admin who create the entry
			id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			name: { type: String, default: '' }
		}
	});

	calendarSchema.index({ 'lastUpdate': 1 });
	calendarSchema.set('autoIndex', params.autoIndex);


	/**
	 * Download events from url
     * promise resolve the number of copied events, do not stop on error
     *
     * @return {Promise}
	 */
	calendarSchema.methods.downloadEvents = function() {


		var calendar = this;

        return new Promise((resolve, reject) => {



            function processEventsData(err, data) {
                if (err) {
                    return reject(err);
                }

                var EventModel = params.db.models.CalendarEvent;

                EventModel.deleteMany({ calendar: calendar._id }, (err) => {

                    if (err)
                    {
                        return reject(err);
                    }

                    var entry = null;
                    var eventPromises = [];

                    for (var k in data) {
                        if (data.hasOwnProperty(k)) {

                            entry = data[k];

                            if (entry.type === 'VEVENT') {
                                var event = new EventModel();
                                event.uid = entry.uid;
                                event.dtstart = entry.start;
                                event.dtend = entry.end;
                                event.summary = entry.summary;
                                event.description = entry.description;
                                event.transp = entry.transparency;
                                if (entry.rrule) {
                                    event.rrule = entry.rrule.toString();
                                }
                                if (entry.rdate) {
                                    event.rdate = entry.rdate;
                                }
                                event.calendar = calendar._id;

                                eventPromises.push(event.save().catch(e => e));
                            }
                        }
                    }

                    Promise.all(eventPromises)
                    .then(results => {
                        for(var i=0; i<results.length; i++) {
                            if (results[i] instanceof Error) {
                                return reject(results[i]);
                            }
                        }

                        resolve(results.length);
                    })
					.then(nb => {
						calendar.lastUpdate = new Date();
						return calendar.save()
						.then(() => {
							return nb;
						});
					});
                });
            }

            if (0 === this.url.indexOf('http://') || 0 === this.url.indexOf('https://')) {
                ical.fromURL(this.url, {}, processEventsData);
            } else {
                // relative address, use the local file instead because the http server is not allways present
                // ex: on database creation
                var data = ical.parseFile('public/'+this.url);
                processEventsData(null, data);
            }


        });
	};



	/**
	 * get events from database beeween two dates
	 * RRULE events are expanded from this mehod
	 *
     * @param {Date} span_start
     * @param {Date} span_end
     * @return {Promise}
	 */
	calendarSchema.methods.getEvents = function(span_start, span_end) {

		var EventModel = params.db.models.CalendarEvent;

		let find = EventModel.find();

		periodCriterion(find, span_start, span_end);

		return find
        .where('calendar', this._id)
		.sort('dtstart')
		.exec()
		.then(documents => {

			let events = [];
            documents.forEach(document => {
                events = events.concat(document.expand(span_start, span_end));
            });

            return events;

		});
	};

    /**
     * Get number of days between two dates using the halfDayHour property
     * @param   {object} event  This object must have dtstart and dtend properties
     * @returns {Number} [[Description]]
     */
    calendarSchema.methods.getDays = function(event) {

        let dtstart = event.dtstart;
        let dtend = new Date(event.dtend);

        if (dtend.getHours() === 0 && dtend.getMinutes() === 0 && dtend.getSeconds() === 0 && dtend.getMilliseconds() === 0) {
            dtend.setMilliseconds(-1);
        }

        let nbDays = dtend.getDate() - dtstart.getDate();

        let startAfternoon = (dtstart.getHours() >= this.halfDayHour.getHours() && dtstart.getMinutes() >= this.halfDayHour.getMinutes());
        let endMorning = (dtend.getHours() <= this.halfDayHour.getHours() && dtend.getMinutes() <= this.halfDayHour.getMinutes());

        if (startAfternoon && endMorning && nbDays === 0) {
            throw new Error('Unexpected event');
        }


        if (startAfternoon !== endMorning) {
            nbDays += 0.5;
        }


        if (!startAfternoon && !endMorning) {
            nbDays += 1;
        }

        return nbDays;
    };


    /**
     * Init task for new database
     * @param   {Company}   company [[Description]]
     * @returns {Function}  The task function
     */
    calendarSchema.statics.getInitTask = function(company) {

        let model = this;

		const gt = params.app.utility.gettext;

		var h13 = new Date();
	    h13.setHours(13,0,0);

        /**
         * initialize default calendars
		 * @return {Promise}
         */
        function createDefaults() {

            let allCalendars = [
            {
                _id: '5740adf51cf1a569643cc101',
                name: gt.gettext('5 days 40H - 8H 12H / 14H 18H'),
                url: 'calendars/5d-40h-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc102',
                name: gt.gettext('5 days 39H - 8H 12H / 14H 18H, 17H on friday'),
                url: 'calendars/5d-39h-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc103',
                name: gt.gettext('5 days 35H - 8H 12H / 14H 17H'),
                url: 'calendars/5d-35h-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 7
            },
            {
                _id: '5740adf51cf1a569643cc104',
                name: gt.gettext('5 days 36H - 8H 12H / 14H 18H, no friday afternoon'),
                url: 'calendars/5d-36h-half-FR-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc105',
                name: gt.gettext('5 days 36H - 8H 12H / 14H 18H, no wednesday afternoon'),
                url: 'calendars/5d-36h-half-WE-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc106',
                name: gt.gettext('5 days 20H - 14H 18H'),
                url: 'calendars/5d-20h-afternoon-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 4
            },
            {
                _id: '5740adf51cf1a569643cc107',
                name: gt.gettext('5 days 20H - 8H 12H'),
                url: 'calendars/5d-20h-morning-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 4
            },
            {
                _id: '5740adf51cf1a569643cc108',
                name: gt.gettext('4 days 32H - 8H 12H / 14H 18H, no friday'),
                url: 'calendars/4d-32h-no-FR-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc109',
                name: gt.gettext('4 days 32H - 8H 12H / 14H 18H, no wednesday'),
                url: 'calendars/4d-32h-no-WE-1.ics',
                type: 'workschedule',
                locked: true,
				hoursPerDay: 8
            },
            {
                _id: '5740adf51cf1a569643cc110',
                name: gt.gettext('5 days 50H - 9H30 13H / 14H 19H, saturday 18H'),
                url: 'calendars/5d-50h-9h30-19h-SA18h-1.ics',
                type: 'workschedule',
                locked: true,
				halfDayHour: h13,
				hoursPerDay: 8.5
            }
            ];



            if ('FR' === company.country) {

                let icsdbBaseUrl = 'https://raw.githubusercontent.com/gadael/icsdb/master/build/fr-FR/';

                allCalendars.push({
                    name: gt.gettext('Guadeloupe non working days'),
                    url: icsdbBaseUrl+'france-guadeloupe-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Guyane non working days'),
                    url: icsdbBaseUrl+'france-guyane-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Martinique non working days'),
                    url: icsdbBaseUrl+'france-martinique-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Moselle, Bas-Rhin, Haut-Rhin non working days'),
                    url: icsdbBaseUrl+'france-moselle-rhin-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    _id: '5740adf51cf1a569643cc100',
                    name: gt.gettext('French non working days (metropolis)'),
                    url: icsdbBaseUrl+'france-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('French polynesia non working days'),
                    url: icsdbBaseUrl+'france-polynesia-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Reunion island non working days'),
                    url: icsdbBaseUrl+'france-reunion-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Wallis and Futuna non working days'),
                    url: icsdbBaseUrl+'france-wallis-futuna-nonworkingdays.ics',
                    type: 'nonworkingday'
                });


				allCalendars.push({
                    name: gt.gettext('School vacation'),
                    url: 'http://www.education.gouv.fr/download.php?file=http%3A%2F%2Fcache.media.education.gouv.fr%2Fics%2FCalendrier_Scolaire_Zones_A_B_C.ics',
                    type: 'holiday'
                });
            }





            if ('BE' === company.country) {

                let icsdbBaseUrl = 'https://raw.githubusercontent.com/gadael/icsdb/master/build/fr-FR/';

                allCalendars.push({
                    name: gt.gettext('Belgium non working days'),
                    url: icsdbBaseUrl+'belgium-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

            }




            if ('IE' === company.country) {
                allCalendars.push({
                    name: gt.gettext('Ireland non working days'),
                    url: 'https://raw.githubusercontent.com/gadael/icsdb/master/build/en-US/ireland-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

            }


            if ('CH' === company.country) {

                let cantons = [
                    'Aargau',
                    'Appenzell Ausserrhoden',
                    'Appenzell Innerrhoden',
                    'Basel-Landschaft',
                    'Basel-Stadt',
                    'Bern',
                    'Fribourg',
                    'Geneva',
                    'Glarus',
                    'Graubünden',
                    'Jura',
                    'Luzern',
                    'Neuchâtel',
                    'Nidwalden',
                    'Obwalden',
                    'Schaffhausen',
                    'Schwyz',
                    'Solothurn',
                    'St Gallen',
                    'Thurgau',
                    'Ticino',
                    'Uri',
                    'Valais',
                    'Vaud',
                    'Zug',
                    'Zürich'
                ];

                cantons.forEach(canton => {
                    allCalendars.push({
                        name: util.format(gt.gettext('%s non working days'), canton),
                        url: 'https://raw.githubusercontent.com/gadael/icsdb/master/build/en-US/switzerland-'+latinize(canton.toLowerCase())+'-nonworkingdays.ics',
                        type: 'nonworkingday'
                    });
                });
            }







            if ('UK' === company.country) {

                let icsdbBaseUrl = 'https://raw.githubusercontent.com/gadael/icsdb/master/build/en-US/';

                allCalendars.push({
                    name: gt.gettext('England and Wales legal holidays'),
                    url: icsdbBaseUrl+'uk-england-wales-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('North Ireland legal holidays'),
                    url: icsdbBaseUrl+'uk-north-ireland-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

                allCalendars.push({
                    name: gt.gettext('Scotland legal holidays'),
                    url: icsdbBaseUrl+'uk-scotland-nonworkingdays.ics',
                    type: 'nonworkingday'
                });

            }







            if ('US' === company.country) {

                let states = [
                    'Alabama',
                    'Alaska',
                    'Arizona',
                    'Arkansas',
                    'California',
                    'North Carolina',
                    'South Carolina',
                    'Colorado',
                    'Connecticut',
                    'North Dakota',
                    'South Dakota',
                    'Delaware',
                    'Florida',
                    'Georgia',
                    'Hawaii',
                    'Idaho',
                    'Illinois',
                    'Indiana',
                    'Iowa',
                    'Kansas',
                    'Kentucky',
                    'Louisiana',
                    'Maine',
                    'Maryland',
                    'Massachusetts',
                    'Michigan',
                    'Minnesota',
                    'Mississippi',
                    'Missouri',
                    'Montana',
                    'Nebraska',
                    'Nevada',
                    'New Hampshire',
                    'New Jersey',
                    'New York',
                    'New Mexico',
                    'Ohio',
                    'Oklahoma',
                    'Oregon',
                    'Pennsylvania',
                    'Rhode Island',
                    'Tennessee',
                    'Texas',
                    'Utah',
                    'Vermont',
                    'Virginia',
                    'West Virginia',
                    'Washington',
                    'Wisconsin',
                    'Wyoming'
                ];

                states.forEach(state => {
                    allCalendars.push({
                        name: util.format(gt.gettext('%s non working days'), state),
                        url: 'https://raw.githubusercontent.com/gadael/icsdb/master/build/en-US/switzerland-'+latinize(state.toLowerCase())+'-nonworkingdays.ics',
                        type: 'nonworkingday'
                    });
                });
            }


			return Promise.all(
	            allCalendars.map(calendar => {
	                let caldoc = new model();
	                caldoc.set(calendar);
	                return caldoc.save();
	            })
			)
			.then(all => {
                return Promise.all(
	                all.map(calendar => {
	                    return calendar.downloadEvents();
	                })
				);
            });
        }



        return createDefaults;
    };






	params.db.model('Calendar', calendarSchema);
};
