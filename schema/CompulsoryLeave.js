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

        userCreated: {							// the user who create the leave
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, minlength: 1 }
        },
        timeCreated: { type: Date, default: Date.now },

        userUpdated: {							// the user who updated the leave
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String
        },
        lastUpdate: Date,

        name: { type: String, minlength: 1 },
        comment: String,

        collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' }],    // references to elements used for creation
        departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],         // references to elements used for creation
        requests: [params.embeddedSchemas.CompulsoryLeaveRequest],                          // list of potential or created requests

        dtstart: { type: Date, required: true },
        dtend: { type: Date, required: true },
        right: { type: mongoose.Schema.Types.ObjectId, ref: 'Right', required: true }
    });


    /**
     * Test if the requests can be created
     * This method will resolve to true if all requests can be created
     *
     * @return {Promise}
     */
    compulsorySchema.methods.canCreateRequest = function() {
        let promises = [];
        let compulsoryLeave = this;

        compulsoryLeave.requests.forEach(clr => {
            promises.push(clr.canCreateRequest(compulsoryLeave));
        });

        return Promise.all(promises)
        .then(list => {
            for (let i=0; i<list.length; i++) {
                if (!list[i]) {
                    return false;
                }
            }

            return true;
        });
    };


    /**
     * Create the requests and update the requests field
     *
     * @return {Promise}
     */
    compulsorySchema.methods.createRequests = function() {
        let promises = [];
        let compulsoryLeave = this;

        compulsoryLeave.requests.forEach(clr => {
            promises.push(clr.createRequest(compulsoryLeave));
        });

        return Promise.all(promises);
    };


    compulsorySchema.set('autoIndex', params.autoIndex);

    compulsorySchema.index({ name: 1 });
    params.db.model('CompulsoryLeave', compulsorySchema);
};
