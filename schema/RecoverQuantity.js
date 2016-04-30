'use strict';

var async = require('async');
var gt = require('./../modules/gettext');


exports = module.exports = function(params) {

	var mongoose = params.mongoose;
	var recoverQuantitySchema = new mongoose.Schema({
		name: { type: String, unique: true },
		quantity: { type: Number, min:0, required: true },
        quantity_unit: { type: String, enum:['D', 'H'], required: true },
		timeCreated: { type: Date, default: Date.now }
	});


    /**
     * initialize default
     */
    recoverQuantitySchema.statics.createFrenchDefaults = function(done) {


		var model = this;


		async.each([
            {
                name: gt.gettext('Half-day'),
                quantity: 0.5,
                quantity_unit: 'D'
            },
            {
                name: gt.gettext('A day'),
                quantity: 1,
                quantity_unit: 'D'
            },
            {
                name: gt.gettext('One hour'),
                quantity: 1,
                quantity_unit: 'H'
            },
            {
                name: gt.gettext('A week-end'),
                quantity: 2,
                quantity_unit: 'D'
            }

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


	recoverQuantitySchema.index({ 'name': 1 }, { unique: true });
	recoverQuantitySchema.set('autoIndex', params.autoIndex);

	params.db.model('RecoverQuantity', recoverQuantitySchema);
};

