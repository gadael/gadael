'use strict';



exports = module.exports = function(params) {
    var collectionSchema = new params.mongoose.Schema({
        name: { type: String, required: true, unique: true  },
        timeCreated: { type: Date, default: Date.now },
        attendance: { type: Number, min: 0, max: 100, default: 100 },   // attendance percentage
                                                                        // vacation right consumption will be recorded according to this percentage
                                                                        // only if consumption=proportion (right property)
                                                                        // ex: for one day of absence,
                                                                        // the consumed quantity will be 0.5 day if the attendance is 50%

        businessDays: {                                                 // list of business days for the collection
            SU: { type: Boolean, default: false },                      // they will be used to set the consumed quantity  for
            MO: { type: Boolean, default: true },                       // the part-times users
            TU: { type: Boolean, default: true },                       // only if consumption=businessDays (right property)
            WE: { type: Boolean, default: true },                       // FR: jours ouvrables
            TH: { type: Boolean, default: true },
            FR: { type: Boolean, default: true },
            SA: { type: Boolean, default: true }
        },

        useWorkschedule: { type:Boolean, default: true },

        customScheduleDays: {                                           // list of week work days for the department
            SU: { type: Boolean, default: false },                      // they will be used to compute RTT if useWorkschedule===false
            MO: { type: Boolean, default: true },
            TU: { type: Boolean, default: true },
            WE: { type: Boolean, default: true },
            TH: { type: Boolean, default: true },
            FR: { type: Boolean, default: true },
            SA: { type: Boolean, default: false }
        },

        workedDays: Number                                              // package agreement
    });

    collectionSchema.set('autoIndex', params.autoIndex);

    
    /**
     * Get the list of business days in an array according to Date.getDay format
     * 0 = sunday
     * 1 = monday
     *
     * @return {Array}
     */
    collectionSchema.methods.getDays = function() {

        let days = [];
        let d = 0;
        let businessDays = this.businessDays.toObject();
        for (var abbr in businessDays) {
            if (businessDays.hasOwnProperty(abbr)) {
                if (businessDays[abbr]) {
                    days.push(d);
                }

                d++;
            }
        }

        return days;
    };



    /**
     * Get the list of worked days in an array according to Date.getDay format
     * use it only if useWorkschedule=== false
     * 0 = sunday
     * 1 = monday
     *
     * @return {Array}
     */
    collectionSchema.methods.getCustomScheduleDays = function() {

        let days = [];
        let d = 0;
        let scheduleDays = this.customScheduleDays.toObject();
        for (var abbr in scheduleDays) {
            if (scheduleDays.hasOwnProperty(abbr)) {
                if (scheduleDays[abbr]) {
                    days.push(d);
                }

                d++;
            }
        }

        return days;
    };





    /**
     * Get the list of rights in collection
     * @return {Promise} resolve to an array of beneficiaries
     */
    collectionSchema.methods.getRights = function getRights() {

        var find = this.model('Beneficiary').find()
            .where('ref').equals('RightCollection')
            .where('document').equals(this._id)
            .populate('right');


        return find.exec();
    };


    collectionSchema.methods.getAccountCollectionQuery = function(moment)
    {
        if (undefined === moment || null === moment) {
            moment = new Date();
            moment.setHours(0,0,0,0);
        }

        let AccountCollection = this.model('AccountCollection');

        return AccountCollection.find()
        .where('rightCollection', this._id)
        .where('from').lte(moment)
        .where({
            '$or': [
                { 'to': null },
                { 'to': { '$gte': moment }}
            ]
        });
    };


    /**
     * Get the list of users with collection
     *
     * @deprecated Because not used
     *
     * @param {Date}    moment  Optional date for collection association to users
     * @return {Promise} resolve to an array of users
     */
    collectionSchema.methods.getUsers = function getUsers(moment) {

        let User = this.model('User');

        return this.getAccountCollectionQuery(moment)
        .exec()
        .then(arr => {
            return User.find()
            .where('roles.account').in(arr.map(ac => ac.account))
            .exec();
        });

    };


    /**
     * Get the accountCollection document
     * @return {Promise}    AccountCollection document
     */
    collectionSchema.methods.getAccountCollection = function(accountId, moment) {
        return this.getAccountCollectionQuery(moment)
        .where('account', accountId)
        .exec()
        .then(arr => {
            if (0 === arr.length) {
                return null;
            }

            return arr[0];
        });
    };



    collectionSchema.statics.getInitTask = function(company) {

        let model = this;

        const gt = params.app.utility.gettext;


        /**
         * @return {Promise}
         */
        function createDefaults() {


            let collections = [
                { _id: '5740adf51cf1a569643cc520', name: gt.gettext('General regime 100%'), attendance: 100, workedDays: 218 },
                { _id: '5740adf51cf1a569643cc521', name: gt.gettext('Part-time 90%'), attendance: 90, workedDays: 218 },
                { _id: '5740adf51cf1a569643cc522', name: gt.gettext('Part-time 80%'), attendance: 80, workedDays: 218 },
                { _id: '5740adf51cf1a569643cc523', name: gt.gettext('Part-time 70%'), attendance: 70, workedDays: 218 },
                { _id: '5740adf51cf1a569643cc524', name: gt.gettext('Part-time 50%'), attendance: 50, workedDays: 218 }
            ];

            return Promise.all(
                collections.map(data => {
                    let collection = new model();
                    collection.set(data);
                    return collection.save();
                })
            );
        }


        return createDefaults;
    };




    params.db.model('RightCollection', collectionSchema);
};
