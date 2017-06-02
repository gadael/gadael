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
                quantity: 20,
                rules: [
                    {
                        type: "request_period",
                        title: gt.gettext("The absence must be within the renewal period"),
                        min: 0,
                        max: 0
                    }
                ],
                renewal: {
                    start: {
                        month:5,
                        day:1
                    }
                }
            },
            {
                name: gt.gettext("Maternity"),
                type: '5740adf51cf1a569643cc50e',
                quantity: null,
                defaultAbsenceLength: 80,
                activeFor: {  account: false },
                hide: true,
                autoDistribution: false,
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
                        day:1,
                        nbYears: 100
                    }
                }
            },
            {
                name: gt.gettext('Unpaid leave'),
                type: '5740adf51cf1a569643cc516',
                quantity: null,
                autoDistribution: false,
                renewal: {
                    start: {
                        month:0,
                        day:1,
                        nbYears: 100
                    }
                }
            }
        ]
    };
};
