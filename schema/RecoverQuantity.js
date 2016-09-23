'use strict';

var async = require('async');


exports = module.exports = function(params) {

	const mongoose = params.mongoose;

	var recoverQuantitySchema = new mongoose.Schema({
		name: { type: String, unique: true },
		quantity: { type: Number, min:0, required: true },
        quantity_unit: { type: String, enum:['D', 'H'], required: true },
		timeCreated: { type: Date, default: Date.now }
	});



    recoverQuantitySchema.statics.getInitTask = function(companyDoc) {

		const gt = params.app.utility.gettext;
        let model = this;

        function createDefaults(done) {

            async.each([
                {
                    _id: '5740adf51cf1a569643cc530',
                    name: gt.gettext('Half-day'),
                    quantity: 0.5,
                    quantity_unit: 'D'
                },
                {
                    _id: '5740adf51cf1a569643cc531',
                    name: gt.gettext('A day'),
                    quantity: 1,
                    quantity_unit: 'D'
                },
                {
                    _id: '5740adf51cf1a569643cc532',
                    name: gt.gettext('One hour'),
                    quantity: 1,
                    quantity_unit: 'H'
                },
                {
                    _id: '5740adf51cf1a569643cc533',
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
        }

        return createDefaults;
    };



	recoverQuantitySchema.index({ 'name': 1 }, { unique: true });
	recoverQuantitySchema.set('autoIndex', params.autoIndex);

	params.db.model('RecoverQuantity', recoverQuantitySchema);
};
