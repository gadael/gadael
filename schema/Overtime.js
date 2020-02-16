'use strict';

exports = module.exports = function(params) {
    const mongoose = params.mongoose;
	const overtimeSchema = new params.mongoose.Schema({
        user: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
            name: { type: String, required: true },
            department: String
        },
        day: { type: Date, required: true },
        events: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'CalendarEvent' // same event IDs as the workperiod recover request
        }],
        quantity: { type: Number, required: true },
        settledQuantity: Number,
		timeCreated: { type: Date, default: Date.now },
        settled: { type: Boolean, default: false },
        settlements: [params.embeddedSchemas.OvertimeSettlement]       // settlement input from admin
	});

	overtimeSchema.set('autoIndex', params.autoIndex);
	params.db.model('Overtime', overtimeSchema);
};
