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
        var gt = require('gettext');
		
		async.each([
            { name: 'Congé payé annuel' },
            { name: 'Congé ancienneté' },
            { name: 'RTT' },
            { name: 'Récupération' },
            { name: 'Compte épargne temps' },
            { name: 'Absence maladie' },
            { name: 'Accident du travail' },
            { name: 'Maternité' },
            { name: 'Paternité' },
            { name: 'Enfant malade' },
            { name: 'Mariage' },
            { name: 'Naissance' },
            { name: 'Décès' },
            { name: 'Formation' },
            { name: 'Déménagement' },
            { name: 'Congé sans solde' },
            { name: 'Grève' },
            { name: 'Congés payés anticipés' },
            { name: 'Congés pour résultat' },
            { name: 'Congé parental' },
            { name: 'Représentation syndicale' },
            { name: 'Absence en tant qu\'élu' },
            { name: 'Absence réserviste' },
            { name: 'Congés de fractionnement', group: true }
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

