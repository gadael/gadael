'use strict';

exports = module.exports = function(params) {
    var statusSchema = new params.mongoose.Schema({
        _id: { type: String },
        pivot: { type: String, default: '' },
        name: { type: String, default: '' }
    });
    statusSchema.plugin(require('./plugins/pagedFind'));
    statusSchema.index({ pivot: 1 });
    statusSchema.index({ name: 1 });
    statusSchema.set('autoIndex', params.autoIndex);

    params.embeddedSchemas.Status = statusSchema;
};
