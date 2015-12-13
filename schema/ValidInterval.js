'use strict';

exports = module.exports = function(params) {

	var mongoose = params.mongoose;


	var validIntervalSchema = new mongoose.Schema({
		start: { type: Date, required: true, default: Date.now },
        finish: { type: Date },
	});


	validIntervalSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.ValidInterval = validIntervalSchema;
};

