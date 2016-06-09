'use strict';



/**
 * A compulsory leave is created by administrator for a list of users
 * One absence request will be created for each user and wit no approval steps
 *
 * @param {Object} params
 */
exports = module.exports = function(params) {

    var mongoose = params.mongoose;

    var compulsorySchema = new params.mongoose.Schema({
        name: { type: String, required: true },
        userCreated: {							// the user who create the leave
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, default: '' }
        },
        timeCreated: { type: Date, default: Date.now },
        comment: { type: String, default: '' },
        collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' }],    // references to elements used for creation
        departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],         // references to elements used for creation
        requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }]                // created requests
    });


    compulsorySchema.set('autoIndex', params.autoIndex);

    compulsorySchema.index({ name: 1 });
    params.db.model('CompulsoryLeave', compulsorySchema);
};
