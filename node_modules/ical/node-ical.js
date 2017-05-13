var ical = require('./ical')
  , request = require('request')
  , fs = require('fs')

exports.fromURL = function(url, opts, cb){
  if (!cb)
    return;
  request(url, opts, function(err, r, data){
    if (err)
      return cb(err, null);
    cb(undefined, ical.parseICS(data));
  })
}

exports.parseFile = function(filename){
  return ical.parseICS(fs.readFileSync(filename, 'utf8'))
}


var rrule = require('rrule').RRule

ical.objectHandlers['RRULE'] = function(val, params, curr, stack, line){
  curr.rrule = line;
  return curr
}


function getRdateValue(params, dateStr) {

  if (params && params[0] === "VALUE=DATE") {

    var comps = /^(\d{4})(\d{2})(\d{2})$/.exec(dateStr);
    if (comps !== null) {
      return new Date(
        comps[1],
        parseInt(comps[2], 10)-1,
        comps[3]
      );
    }
  }

  var comps = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(dateStr);
  if (comps !== null) {
    if (comps[7] == 'Z') { // GMT
      return new Date(Date.UTC(
        parseInt(comps[1], 10),
        parseInt(comps[2], 10)-1,
        parseInt(comps[3], 10),
        parseInt(comps[4], 10),
        parseInt(comps[5], 10),
        parseInt(comps[6], 10 )
      ));
    } else {
      return new Date(
        parseInt(comps[1], 10),
        parseInt(comps[2], 10)-1,
        parseInt(comps[3], 10),
        parseInt(comps[4], 10),
        parseInt(comps[5], 10),
        parseInt(comps[6], 10)
      );
    }
  }

  return null;
}


ical.objectHandlers['RDATE'] = function(val, params, curr, par, line){
  curr.rdate = [];
  var convertedDate;
  var all = val.split(',');

  for (var i=0; i<all.length; i++) {
    convertedDate = getRdateValue(params, all[i]);
    if (convertedDate instanceof Date) {
      curr.rdate.push(convertedDate);
    }
  }

  return curr;
}



var originalEnd = ical.objectHandlers['END'];
ical.objectHandlers['END'] = function(val, params, curr, stack){

  if (curr.rrule || curr.rdate) {
    var RRuleSet = require('rrule').RRuleSet;
    curr.rruleSet = new RRuleSet();
  }

  if (curr.rrule) {
    var rule = curr.rrule.replace('RRULE:', '');
    if (rule.indexOf('DTSTART') === -1) {
      rule += ';DTSTART=' + curr.start.toISOString().replace(/[-:]/g, '');
      rule = rule.replace(/\.[0-9]{3}/, '');
    }
    curr.rrule = rrule.fromString(rule);
    curr.rruleSet.rrule(curr.rrule);
  }

  if (curr.rdate) {
    curr.rdate.forEach(function(rd) {
      if (rd instanceof Date) {
        curr.rruleSet.rdate(rd);
      }
    });
  }

  return originalEnd.call(this, val, params, curr, stack);
}

