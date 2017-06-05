'use strict';

const util = require('util');

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
     * initialize default types on database creation
	 * The types created by default are not modifiables
     * @param   {Company}  company Company document not yet saved
     * @returns {Function} 	task function for parallels initialization of tables
     */
    typeSchema.statics.getInitTask = function(company) {

        let model = this;

		const gt = params.app.utility.gettext;

        /**
         *
         *
         * @return {Promise}
         */
        function createDefaults() {


            let allTypes = [
                { _id: '5740adf51cf1a569643cc508' , color: '#303F9F',  name: gt.gettext('Paid annual leave')                , sortkey: 1 },
                { _id: '5740adf51cf1a569643cc509' , color: '#FF9800',  name: gt.gettext('Seniority leave')                  , sortkey: 2 },
                { _id: '5740adf51cf1a569643cc50a' , color: '#757575',  name: gt.gettext('Recovery')                         , sortkey: 4, groupFolded: true },
                { _id: '5740adf51cf1a569643cc50b' , color: '#C5CAE9',  name: gt.gettext('sickness absence')                 , sortkey: 6 },
                { _id: '5740adf51cf1a569643cc50c' , color: '#9C27B0',  name: gt.gettext('Work accident')                    , sortkey: 7 },
                { _id: '5740adf51cf1a569643cc50d' , color: '#E1BEE7',  name: gt.gettext('Parental leave')                   , sortkey: 8 },
                { _id: '5740adf51cf1a569643cc50e' , color: '#8BC34A',  name: gt.gettext('Maternity')                        , sortkey: 9 },
                { _id: '5740adf51cf1a569643cc50f' , color: '#4CAF50',  name: gt.gettext('Paternity')                        , sortkey: 10 },
                { _id: '5740adf51cf1a569643cc510' , color: '#7B1FA2',  name: gt.gettext('Sick child')                       , sortkey: 11 },
                { _id: '5740adf51cf1a569643cc511' , color: '#B2EBF2',  name: gt.gettext('Wedding')                          , sortkey: 12 },
                { _id: '5740adf51cf1a569643cc512' , color: '#FF4081',  name: gt.gettext('Birth')                            , sortkey: 13 },
                { _id: '5740adf51cf1a569643cc513' , color: '#212121',  name: gt.gettext('Decease')                          , sortkey: 14 },
                { _id: '5740adf51cf1a569643cc514' , color: '#C2185B',  name: gt.gettext('Training')                         , sortkey: 15 },
                { _id: '5740adf51cf1a569643cc515' , color: '#E64A19',  name: gt.gettext('Relocation')                       , sortkey: 16 },
                { _id: '5740adf51cf1a569643cc516' , color: '#BDBDBD',  name: gt.gettext('Unpaid leave')                     , sortkey: 17 },
                { _id: '5740adf51cf1a569643cc517' , color: '#FF5252',  name: gt.gettext('Strike')                           , sortkey: 18 },
                { _id: '5740adf51cf1a569643cc518' , color: '#FF5252',  name: gt.gettext('Leave for results')                , sortkey: 19 },
                { _id: '5740adf51cf1a569643cc519' , color: '#FF5252',  name: gt.gettext('Union representation')             , sortkey: 20 }, // representation syndicale
                { _id: '5740adf51cf1a569643cc51a' , color: '#FF5252',  name: gt.gettext('Absence as an elected official')   , sortkey: 21 },
                { _id: '5740adf51cf1a569643cc51b' , color: '#FF5252',  name: gt.gettext('Reservist leave')                  , sortkey: 22 },
                { _id: '5740adf51cf1a569643cc51c' , color: '#0097A7',  name: gt.gettext('Presence in court')                , sortkey: 24 }
            ];

            if ('FR' === company.country) {
                allTypes.push({ _id: '5740adf51cf1a569643cc51d' , color: '#C5CAE9', name: gt.gettext('RTT')                       , sortkey: 3 });
                allTypes.push({ _id: '5740adf51cf1a569643cc51e' , color: '#795548', name: gt.gettext('Time savings account')      , sortkey: 5 });
                allTypes.push({ _id: '5740adf51cf1a569643cc51f' , color: '#FF4081', name: gt.gettext('Fractionating leave')       , sortkey: 23, groupFolded: true });
            }

			return Promise.all(
				allTypes.map(fieldsToSet => {
					let type = new model();
	                type.set(fieldsToSet);
					type.locked = true;
					return type.save();
				})
			);

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
		const gt = params.app.utility.gettext;
        let Right = this.model('Right');
        let type = this;



        return Right.find({ type: type }).exec()
        .then(rights => {

            let promises = [];
            rights.forEach(right => {
                promises.push(right.getInitialQuantityInPeriod(user, dtstart, dtend));
            });


            return Promise.all(promises)
			.then(all => {

				if (0 === all.length) {
					throw new Error(util.format(gt.gettext('No rights found in type "%s"'), type.name));
				}

	            return all.reduce((sum, initialQuantity) => {
	                return sum + initialQuantity;
	            });
	        });
        });

    };


	typeSchema.index({ 'name': 1 }, { unique: true });
	typeSchema.set('autoIndex', params.autoIndex);

	params.db.model('Type', typeSchema);
};
