'use strict';

exports = module.exports = function(app, mongoose) {
  var departmentSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    timeCreated: { type: Date, default: Date.now }
  });
  
  departmentSchema.index({ 'name': 1 }, { unique: true });
  departmentSchema.index({ 'parent': 1 });
  departmentSchema.set('autoIndex', (app.get('env') === 'development'));
  
  app.db.model('Department', departmentSchema);
};
