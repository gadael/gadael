'use strict';



/**
 * Send email
 * 
 * @param	Object	req
 * 
 * @param	Object	res
 * 
 * @param	Object  options
 *  options = {
 *  	from: String,
 *  	to: String,
 *  	cc: String,
 *  	bcc: String,
 *  	text: String,
 *  	html: String,
 *  	attachements: [String],
 *  	success: Function,
 *  	error: Function
 *  } 
 */
exports = module.exports = function(req, res, options) {
  



  var attachements = [];

  if (options.html) {
	attachements.push({ data: options.html, alternative: true });
  }

  if (options.attachments) {
	for (var i = 0 ; i < options.attachments.length ; i++) {
	  attachements.push(options.attachments[i]);
	}
  }

  var emailjs = require('emailjs/email');
  var emailer = emailjs.server.connect( req.app.config.smtp.credentials );
  emailer.send({
	from: options.from,
	to: options.to,
	'reply-to': options.replyTo || options.from,
	cc: options.cc,
	bcc: options.bcc,
	subject: options.subject,
	text: options.text,
	attachment: attachements
  }, function(err, message) {
	if (err) {
	  options.error('Email failed to send. '+ err);
	  return;
	}
	else {
	  options.success(message);
	  return;
	}
  });
};
