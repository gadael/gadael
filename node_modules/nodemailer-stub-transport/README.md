# Stub transport module for Nodemailer

Applies for Nodemailer v1.0

Stub transport does not send anything, it builds the mail stream into a single Buffer and returns it with the sendMail callback. This is useful for testing the emails before actually sending anything.

## Usage

Install with npm

    npm install nodemailer-stub-transport

Require to your script

```javascript
var nodemailer = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');
```

Create a Nodemailer transport object

```javascript
var transport = nodemailer.createTransport(stubTransport());
```

Send a message

```javascript
transport.sendMail(mailData, function(err, info){
    console.log(info.response.toString());
});
```

## Errors

There's not much to error about but if you want the sending to fail and return an error then you can do this by specifying an error option when setting up the transport
.

```javascript
var transport = nodemailer.createTransport(stubTransport({
    error: new Error('Invalid recipient')
}));
transport.sendMail(mailData, function(err, info){
    console.log(err.message); // 'Invalid recipient'
});
```

### Events

#### 'log'

Debug log object with `{name, version, level, type, message}`

#### 'envelope'

Envelope object

#### 'data'

Data chunk

## License

**MIT**
