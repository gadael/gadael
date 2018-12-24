'use strict';

const crypto = require('crypto');
const util = require('util');
const resetpassword = require('../modules/emails/resetpassword');





/**
 * Send an email with a reset password link
 */
exports.forgotPassword = function(req, res, next) {

	let User = req.app.db.models.User;
	let gt = req.app.utility.gettext;
	let workflow = req.app.utility.workflow(req, res);

	workflow.on('validate', function() {
		if (!req.body.email) {
			workflow.outcome.errfor.email = 'required';
			workflow.httpstatus = 400;
			return workflow.emit('response');
		}

		workflow.emit('generateToken');
	});

  	workflow.on('generateToken', function() {
	    crypto.randomBytes(21, function(err, buf) {
			if (err) {
				return next(err);
			}

			var token = buf.toString('hex');
			User.encryptPassword(token)
			.then(hash => {
				workflow.emit('patchUser', token, hash);
			})
			.catch(next);
		});
	});

	workflow.on('patchUser', function(token, hash) {

		let conditions = { email: req.body.email.toLowerCase() };
		let fieldsToSet = {
			resetPasswordToken: hash,
			resetPasswordExpires: Date.now() + 10000000
		};

		User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
			if (err) {
				return workflow.emit('exception', err);
			}

			if (!user) {

				workflow.outcome.alert.push({
					type: 'danger',
					message: util.format(gt.gettext('No user found with email %s'), req.body.email.toLowerCase())
				});
				return workflow.emit('response');
			}

			workflow.emit('sendEmail', token, user);
		});
	});


	workflow.on('sendEmail', function(token, user) {

		resetpassword(req.app, token, user)
		.then(mail => {
			return mail.send();
		})
		.then(() => {
			workflow.outcome.alert.push({
				type: 'info',
				message: util.format(gt.gettext('An email has been sent to %s'), user.email)
			});

			workflow.emit('response');
		})
		.catch(err => {
		    workflow.outcome.alert.push({
				type: 'danger',
				message: 'Error Sending: '+ err.getMessage()
			});
		  	workflow.emit('response');
		});
	});

	workflow.emit('validate');
};







/**
 * Reset password
 */
exports.resetPassword = function(req, res) {

	let User = req.app.db.models.User;
	let gt = req.app.utility.gettext;
	let workflow = req.app.utility.workflow(req, res);

	workflow.on('validate', function() {

		if (!req.body.password) {
			workflow.outcome.errfor.password = 'required';
			workflow.httpstatus = 400; // Bad Request
		}

		if (!req.body.confirm) {
			workflow.outcome.errfor.confirm = 'required';
			workflow.httpstatus = 400; // Bad Request
		}

		if (req.body.confirm !== req.body.password) {
			workflow.outcome.errfor.confirm = 'error';
			workflow.httpstatus = 400; // Bad Request
			workflow.outcome.alert.push({
				type: 'danger',
				message: gt.gettext('The password confirmation does not match the new password field')
			});
		}

		if (workflow.hasErrors()) {
			return workflow.emit('response');
		}

		workflow.emit('findUser');
	});


	workflow.on('findUser', function() {

		var conditions = {
			email: req.body.email,
			resetPasswordExpires: { $gt: Date.now() }
		};

		User.findOne(conditions, (err, user) => {
			if (err) {
				return workflow.emit('exception', err);
			}

			if (!user) {
				workflow.outcome.alert.push({
					type: 'danger',
					message: gt.gettext('Invalid request. user not found')
				});
				return workflow.emit('response');
			}

			User.validatePassword(req.body.token, user.resetPasswordToken, (err, isValid) => {
				if (err) {
					return workflow.emit('exception', err);
				}

				if (!isValid) {
					workflow.outcome.alert.push({
						type: 'danger',
						message: gt.gettext('Invalid request.')
					});
					return workflow.emit('response');
				}

				workflow.emit('patchUser', user);
			});
		});
	});

	workflow.on('patchUser', function(user) {
		req.app.db.models.User.encryptPassword(req.body.password)
		.then(function(hash) {

			var fieldsToSet = { password: hash, resetPasswordToken: '' };
			User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
				if (err) {
					return workflow.emit('exception', err);
				}

				workflow.outcome.alert.push({
					type: 'success',
					message: gt.gettext('The password has been modified')
				});
				workflow.emit('response');
			});
		})
		.catch(err => {
			workflow.emit('exception', err);
		});
	});

	workflow.emit('validate');
};
