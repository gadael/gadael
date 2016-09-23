'use strict';

module.exports = exports = function(app) {

    const gt = app.utility.gettext;

    return {
        rights: [
            {
                name: gt.gettext("Paid annual leave"),
                type: '5740adf51cf1a569643cc508',
                quantity: 20,
                rules: [
                    {
                        type: "request_period",
                        title: gt.gettext("The absence must be made after the renewal start date, and within 5 years following the end of the renewal period"),
                        min: 0,
                        max: 5,
                        unit: 'Y'
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
                name: gt.gettext("Paid annual leave until the age of 20 years old"),
                type: '5740adf51cf1a569643cc508',
                quantity: 5,
                rules: [
                    {
                        type: "request_period",
                        title: gt.gettext("The absence must be made after the renewal start date, and within 5 years following the end of the renewal period"),
                        min: 0,
                        max: 5,
                        unit: 'Y'
                    },
                    {
                        type: "age",
                        title: gt.gettext("Under 21 at the time of the absence"),
                        min: 0,
                        max: 21,
                        unit: 'Y'
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
                name: gt.gettext("Maternity"),
                type: '5740adf51cf1a569643cc50e',
                quantity: 98,
                activeFor: {  account: false }
            }
        ]
    };
};
