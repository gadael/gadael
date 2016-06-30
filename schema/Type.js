'use strict';

var async = require('async');
var gt = require('./../modules/gettext');


exports = module.exports = function(params) {
	
	var mongoose = params.mongoose;
	var typeSchema = new mongoose.Schema({
		name: { type: String, unique: true },		
		color: { type: String },
		groupFolded: { type: Boolean, default: false }, 	// folding status in the request creation page
        groupTitle: String,
        sortkey: Number,
		timeCreated: { type: Date, default: Date.now },
        // used for the default types embeded in the app
		locked: { type: Boolean, default: false }
	});
    
    

    /**
     * Get group title, the manager probably configured a plural version of the name
     * in the groupTitle field but the field is optional
     * @returns {String}
     */
    typeSchema.methods.getGroupTitle = function() {
        return this.groupTitle || this.name;
    };


    /**
     * Get a task to initialize types when the database is created
     * @param   {Company}  company Company document not yet saved
     * @returns {Function} async task function for parallels initialization of tables
     */
    typeSchema.statics.getInitTask = function(company) {

        let model = this;


        /**
         * initialize default types on database creation
         * The types created by default are not modifiables
         *
         * @param {function} done   Callback
         */
        function createDefaults(done) {

            
            let allTypes = [
                { _id: '5740adf51cf1a569643cc508' ,  name: gt.gettext('Paid annual leave')                , sortkey: 1 },
                { _id: '5740adf51cf1a569643cc509' ,  name: gt.gettext('Seniority leave')                  , sortkey: 2 },
                { _id: '5740adf51cf1a569643cc50a' ,  name: gt.gettext('Recovery')                         , sortkey: 4, groupFolded: true },
                { _id: '5740adf51cf1a569643cc50b' ,  name: gt.gettext('sickness absence')                 , sortkey: 6 },
                { _id: '5740adf51cf1a569643cc50c' ,  name: gt.gettext('Work accident')                    , sortkey: 7 },
                { _id: '5740adf51cf1a569643cc50d' ,  name: gt.gettext('Parental leave')                   , sortkey: 8 },
                { _id: '5740adf51cf1a569643cc50e' ,  name: gt.gettext('Maternity')                        , sortkey: 9 },
                { _id: '5740adf51cf1a569643cc50f' ,  name: gt.gettext('Paternity')                        , sortkey: 10 },
                { _id: '5740adf51cf1a569643cc510' ,  name: gt.gettext('Sick child')                       , sortkey: 11 },
                { _id: '5740adf51cf1a569643cc511' ,  name: gt.gettext('Wedding')                          , sortkey: 12 },
                { _id: '5740adf51cf1a569643cc512' ,  name: gt.gettext('Birth')                            , sortkey: 13 },
                { _id: '5740adf51cf1a569643cc513' ,  name: gt.gettext('Decease')                          , sortkey: 14 },
                { _id: '5740adf51cf1a569643cc514' ,  name: gt.gettext('Training')                         , sortkey: 15 },
                { _id: '5740adf51cf1a569643cc515' ,  name: gt.gettext('Relocation')                       , sortkey: 16 },
                { _id: '5740adf51cf1a569643cc516' ,  name: gt.gettext('Unpaid leave')                     , sortkey: 17 },
                { _id: '5740adf51cf1a569643cc517' ,  name: gt.gettext('Strike')                           , sortkey: 18 },
                { _id: '5740adf51cf1a569643cc518' ,  name: gt.gettext('Leave for results')                , sortkey: 19 },
                { _id: '5740adf51cf1a569643cc519' ,  name: gt.gettext('Union representation')             , sortkey: 20 }, // representation syndicale
                { _id: '5740adf51cf1a569643cc51a' ,  name: gt.gettext('Absence as an elected official')   , sortkey: 21 },
                { _id: '5740adf51cf1a569643cc51b' ,  name: gt.gettext('Reservist leave')                  , sortkey: 22 },
                { _id: '5740adf51cf1a569643cc51c' ,  name: gt.gettext('Presence in court')                , sortkey: 24 }
            ];

            if ('FR' === company.country) {
                allTypes.push({ _id: '5740adf51cf1a569643cc51d' , name: gt.gettext('RTT')                       , sortkey: 3 });
                allTypes.push({ _id: '5740adf51cf1a569643cc51e' , name: gt.gettext('Time savings account')      , sortkey: 5 });
                allTypes.push({ _id: '5740adf51cf1a569643cc51f' , name: gt.gettext('Fractionating leave')       , sortkey: 23, groupFolded: true });
            }

            async.each(allTypes, function( fieldsToSet, callback) {

                let type = new model();
                type.set(fieldsToSet);
                type.locked = true;

                type.save(type, function(err) {
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
    

    /**
     * Get the quantity added on initial quantity between two dates on all rights of the type
     * this include initial quantity of the right and adjustments
     *
     * @param {User} user
     * @param {Date} dtstart
     * @param {Date} dtend
     *
     * @returns {Promise}
     */
    typeSchema.methods.getInitialQuantityInPeriod = function(user, dtstart, dtend) {
        let Right = this.model('Right');
        let type = this;

        return Right.find({ type: type }).exec()
        .then(rights => {

            let promises = [];
            rights.forEach(right => {
                promises.push(right.getInitialQuantityInPeriod(user, dtstart, dtend));
            });

            return Promise.all(promises);
        })
        .then(all => {
            return all.reduce((sum, initialQuantity) => {
                return sum + initialQuantity;
            });
        });
    };

  
	typeSchema.index({ 'name': 1 }, { unique: true });
	typeSchema.set('autoIndex', params.autoIndex);
  
	params.db.model('Type', typeSchema);
};

