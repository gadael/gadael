[![Build Status](https://travis-ci.org/polo2ro/jurassic.svg?branch=master)](https://travis-ci.org/polo2ro/jurassic)

# jurassic

A javascript library for manipulating periods. The library contain 2 base objects to handle periods:

* jurassic.Era: a group of periods
* jurassic.Period: a period with a start date and end date

The library has been tested only on node.js

Usage
-----

```bash
npm install jurassic
```


# Methods

Era.addPeriod
-------------
Add a period to Era, accept a period object as parameter, 
if the given parameter is not a period, the period will be created from the object

```javascript

var jurassic = require('jurassic');
var era = new jurassic.Era();

var event1 = new jurassic.Period();
event1.dtstart = new Date(2014,0,1);
event1.dtend = new Date(2014,0,3);

era.addPeriod(event1);

era.addPeriod({
    dtstart: new Date(2014,0,6),
    dtend: new Date(2014,0,8)
});
```

The period can contain other properties such as icalendar properties


Era.removePeriod
----------------
Remove a periods from era using dates only, if a period with the same dates exists in era, il will be removed.
Accept a period object as parameter

Era.getFlattenedEra
-------------------
Get a new era with all overlapping periods merged as single periods

Era.addEra
----------
Returns a new Era object whose value is the sum of the specified Era object and this instance.

Era.subtractPeriod
-------------------
Update the Era object with the difference between the specified Period object and this instance.
Accept a period object as parameter


```javascript

var jurassic = require('jurassic');
var era = new jurassic.Era();

era.addPeriod({
    dtstart: new Date(2014,0,1),
    dtend: new Date(2014,0,15)
});

var drill = new jurassic.Period();
drill.dtstart = new Date(2014,0,10);
drill.dtend = new Date(2014,0,11);

era.subtractPeriod(drill);

// here we have 2 periods, from 1 to 10 and from 11 to 15
```



Era.subtractEra
----------------
Update the Era object with the difference between the specified Era object and this instance.



Era.intersectPeriod
-------------------
Get the intesection of the era with a period. Accept a period object as parameter. This method return an Era object (a list of periods)
the properties from the periods stored in the era object will be retained in the new periods produced by this method.

Era.intersectEra
----------------
Get the intesection of the specified Era object and this instance. This method return an Era object (a list of periods)



# Period

A period can contain any property, only dtstart and dtend are mandatory for the interaction with the library methods.


Period.getBusinessDays
--------------
get the number of days in period with a precision of 0.5 days


