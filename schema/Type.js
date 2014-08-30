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
    typeSchema.statics.createDefaults = function(done) {
		
		
		var model = this;
        var async = require('async');
		
		async.each([
            { name: '', color: '' },
            { name: '', color: '' },
            { name: '', color: '' },
            { name: '', color: '' },
            { name: '', color: '' }
            
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
            if( err ) {
              console.log(err);
            }
        });
    };
    
  
	typeSchema.index({ 'name': 1 }, { unique: true });
	typeSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Type', typeSchema);
};

