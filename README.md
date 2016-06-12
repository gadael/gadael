# ![Gadael](public/images/logoText256.png)

[![Build Status](https://travis-ci.org/gadael/gadael.svg)](https://travis-ci.org/gadael/gadael)
[![Code Climate](https://codeclimate.com/github/gadael/gadael/badges/gpa.svg)](https://codeclimate.com/github/gadael/gadael)
[![Test Coverage](https://codeclimate.com/github/gadael/gadael/badges/coverage.svg)](https://codeclimate.com/github/gadael/gadael/coverage)

nodejs absences management application

In developpement, not ready for production




This application help you manage presence of your employees in your company. The staff can do requests, access to their planning, the department planning, the remaining vacation rights...

* Leave requests
* Time saving deposits requests
* Workperiod recovery requests

Approval by managers is following hierachical departments structure.


## Install on a debian system

As root

```bash
apt-get install mongodb nodejs git g++ gyp
npm install -g grunt-cli
```

As user

```bash
git clone https://github.com/gadael/gadael
cd gadael
npm install
bower install
grunt build

node app.js
```

open http://localhost:3000 in your browser

Application listen on localhost only, an https reverse proxy will be necessary to open access to users.


## Tests

```bash
grunt test
```

## TODO

- [ ] Request modification from user
- [ ] Edit request from admin
- [ ] Delete requests from admin
- [x] Fix moment-duration-format decimal separator
- [ ] Sage Export
- [ ] Decrease RTT depending on the illness leaves
- [x] Display homepage text for public/private
- [x] Display company name from the common rest service on homepage
- [x] ICSDB integration database initialisation
- [ ] ICSDB integration for non working days calendars
- [x] Rights initialization by country
- [x] Create data for a demo company
- [x] Test calendar initialization by country
- [x] Test rights initialization by country
- [x] Test age rule type (Swiss)
- [ ] In the request_period rule type, allow interval duration in years (5 years for swiss annual leaves)
- [x] Add test for renewal.getPlannedWorkDayNumber
- [x] Test account.getWeekHours
- [ ] Dynamic intial quantity computed from the number of worked days in the previous renewal period (french RTT, belgium annual leaves ...) see renewal.getPlannedWorkDayNumber
- [ ] Set right duration in weeks
- [ ] ICS Export
- [x] Add a test: method account.getPeriodUnavailableEvents or /rest/account/unavailableevents
- [x] Page for custom quantities accout-renewalquantity controller
- [ ] Emails notifications
- [ ] Compulsory leaves management, test rest service
- [x] Create a test to check if leave request creation fail if the consumed quantity is greater than available quantity but the duration quantity is lower

## Technical features

* [Express JS](http://expressjs.com/) application
* [Angular JS](https://angularjs.org/) front-end
* [Bootstrap CSS](http://getbootstrap.com/) Look and feel



## Licence

MIT

FSF approved, OSI approved and GPL compatible...