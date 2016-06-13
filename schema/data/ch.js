'use strict';

const gt = require('./../../modules/gettext');

module.exports = exports = {
    rights: [
        {
            name: gt.gettext("Paid annual leave"),
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
            quantity: 5,
            name: gt.gettext("Paid annual leave until the age of 20 years old"),
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
            quantity: 98,
            activeFor: {  account: false }
        }
    ]
};
