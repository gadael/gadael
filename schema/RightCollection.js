'use strict';

exports = module.exports = function(params) {
    var collectionSchema = new params.mongoose.Schema({
        name: { type: String, required: true, unique: true  },
        timeCreated: { type: Date, default: Date.now }
    });
  
    collectionSchema.set('autoIndex', params.autoIndex);
  
    collectionSchema.index({ name: 1 });
  
    params.db.model('RightCollection', collectionSchema);
};

