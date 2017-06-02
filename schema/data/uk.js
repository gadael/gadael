'use strict';

module.exports = exports = function(app) {

    const gt = app.utility.gettext;

    return {
        rights: [
            {
                _id: '577225e3f3c65dd800257bdc',
                special: 'annualleave',
                name: gt.gettext("Paid annual leave"),
                type: '5740adf51cf1a569643cc508',
                quantity: 28,
                rules: [
                    {
                        type: "entry_date",
                        title: gt.gettext("The creation of the request can be made in the period of renewal, with 30 days of tolerance"),
                        min: 30,
                        max: 30
                    },
                    {
                        type: "request_period",
                        title: gt.gettext("The absence must be within the renewal period"),
                        min: 0,
                        max: 0
                    }
                ],
                renewal: {
                    start: {
                        month:0,
                        day:1
                    }
                }
            },
            {
                name: gt.gettext("Ordinary Maternity Leave"),
                type: '5740adf51cf1a569643cc50e',
                quantity: null,
                defaultAbsenceLength: 130, // 26 weeks
                activeFor: {  account: false },
                hide: true,
                renewal: {
                    start: {
                        month:0,
                        day:1
                    },
                    nbYears: 100
                }
            },
            {
                name: gt.gettext("Additional Maternity Leave"),
                type: '5740adf51cf1a569643cc50e',
                quantity: null,
                defaultAbsenceLength: 130, // 26 weeks
                activeFor: {  account: false },
                hide: true,
                renewal: {
                    start: {
                        month:0,
                        day:1
                    },
                    nbYears: 100
                }
            },
            {
                name: gt.gettext('Sickness absence'),
                type: '5740adf51cf1a569643cc50b',
                quantity: null,
                activeFor: { account: false },
                autoDistribution: false,
                renewal: {
                    start: {
                        month:0,
                        day:1
                    },
                    nbYears: 100
                }
            }
        ]
    };
};
