'use strict';

const gt = require('./../../modules/gettext');

module.exports = exports = {
    rights: [
        {
            _id: '577225e3f3c65dd800257bdc',
            special: 'annualleave',
            name: gt.gettext("Paid annual leave"),
            quantity: 25,
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
                    month:5,
                    day:1
                }
            }
        },
        {
            _id: '5770cad63fccf8da5150e7da',
            special: 'rtt',
            name: "RTT",
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
                    month:5,
                    day:1
                }
            }
        },
        {
            name: gt.gettext("Maternity"),
            quantity: 80,
            activeFor: {  account: false }
        }
    ]
};
