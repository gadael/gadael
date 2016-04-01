'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var typeSchema = new mongoose.Schema({
		name: { type: String, unique: true },		
		color: { type: String },
		groupFolded: { type: Boolean, default: false }, 	// folding status in the request creation page
        groupTitle: String,
        sortkey: Number,
		timeCreated: { type: Date, default: Date.now }
	});
    
    

    /**
     * Get group title, the manager probably configured a plural version of the name
     * in the groupTitle field but the field is optional
     * @returns {String}
     */
    typeSchema.methods.getGroupTitle = function() {
        return this.groupTitle || this.name;
    };


    /**
     * initialize default types on database creation
     * @param {function} done   Callback
     */  
    typeSchema.statics.createFrenchDefaults = function(done) {
		
		
		var model = this;
        var async = require('async');
        var gt = require('./../modules/gettext');
		
		async.each([
            { name: gt.gettext('Paid annual leave')         , sortkey: 1 },
            { name: gt.gettext('Seniority leave')           , sortkey: 2 },
            { name: gt.gettext('RTT')                       , sortkey: 3 },
            { name: gt.gettext('Recovery')                  , sortkey: 4, groupFolded: true },
            { name: gt.gettext('Time savings account')      , sortkey: 5 },
            { name: gt.gettext('sickness absence')          , sortkey: 6 },
            { name: gt.gettext('Work accident')             , sortkey: 7 },
            { name: gt.gettext('Parental leave')            , sortkey: 8 },
            { name: gt.gettext('Maternity')                 , sortkey: 9 },
            { name: gt.gettext('Paternity')                 , sortkey: 10 },
            { name: gt.gettext('Sick child')                , sortkey: 11 },
            { name: gt.gettext('Wedding')                   , sortkey: 12 },
            { name: gt.gettext('Birth')                     , sortkey: 13 },
            { name: gt.gettext('Decease')                   , sortkey: 14 },
            { name: gt.gettext('Training')                  , sortkey: 15 },
            { name: gt.gettext('Relocation')                , sortkey: 16 },
            { name: gt.gettext('Unpaid leave')              , sortkey: 17 },
            { name: gt.gettext('Strike')                    , sortkey: 18 },
            { name: gt.gettext('Leave for results')         , sortkey: 19 },
            { name: gt.gettext('Union representation')      , sortkey: 20 },
            { name: gt.gettext('Absence as an elected official'), sortkey: 21 },
            { name: gt.gettext('Reservist leave')           , sortkey: 22 },
            { name: gt.gettext('Fractionating leave')       , sortkey: 23, groupFolded: true }
        ], function( type, callback) {
            
          model.create(type, function(err) {
              if (err) {
                  callback(err);
                  return;
              }
              
              callback();
          });
        }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if(err) {
                console.trace(err);
                return;
            }
            
            if (done) {
                done();
            }
        });
    };
    
  
	typeSchema.index({ 'name': 1 }, { unique: true });
	typeSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Type', typeSchema);
};

