'use strict';

exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var typeSchema = new mongoose.Schema({
		name: { type: String, unique: true },		
		color: { type: String },					// color in calendar
		group: { type: Boolean, default: false }, 	// user can select only one right from type
		timeCreated: { type: Date, default: Date.now }
	});
    
    
    /**
     * initialize default types
     */  
    typeSchema.statics.createFrenchDefaults = function(done) {
		
		
		var model = this;
        var async = require('async');
        var Gettext = require('node-gettext');
        var gt = new Gettext();
		
		async.each([
            { name: gt.gettext('Paid annual leave') },
            { name: gt.gettext('Seniority leave') },
            { name: gt.gettext('RTT') },
            { name: gt.gettext('Recovery') },
            { name: gt.gettext('Time savings account') },
            { name: gt.gettext('sickness absence') },
            { name: gt.gettext('Work accident') },
            { name: gt.gettext('Parental leave') },
            { name: gt.gettext('Maternity') },
            { name: gt.gettext('Paternity') },
            { name: gt.gettext('Sick child') },
            { name: gt.gettext('Wedding') },
            { name: gt.gettext('Birth') },
            { name: gt.gettext('Decease') },
            { name: gt.gettext('Training') },
            { name: gt.gettext('Relocation') },
            { name: gt.gettext('Unpaid leave') },
            { name: gt.gettext('Strike') },
            { name: gt.gettext('Leave for results') },
            { name: gt.gettext('Union representation') },
            { name: gt.gettext('Absence as an elected official') },
            { name: gt.gettext('Reservist leave') },
            { name: gt.gettext('Fractionating leave'), group: true }
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
                console.log(err);
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

