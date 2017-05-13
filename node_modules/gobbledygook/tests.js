/* lloyd|2012|http://wtfpl.org */

const gobbledygook = require('./');

const tests = [
  [ "I LOVE YOU",
    "∩O⅄ ƎɅO⅂ I" ],
  [ "%s uses Persona to sign you in!",
    "¡uı noʎ uƃıs oʇ auosɹǝԀ sǝsn %s" ],

  [ "Please close this window, <a %s>enable cookies</a> and try again",
    "uıaƃa ʎɹʇ pua <a %s>sǝıʞooɔ ǝʅqauǝ</a> ´ʍopuıʍ sıɥʇ ǝsoʅɔ ǝsaǝʅԀ" ],
  [ "Please close this window, <a %(cookieLink)s>enable <b>super dooper %(persona)s</b> cookies</a> and try again",
    "uıaƃa ʎɹʇ pua <a %(cookieLink)s>sǝıʞooɔ <b>%(persona)s ɹǝdoop ɹǝdns</b> ǝʅqauǝ</a> ´ʍopuıʍ sıɥʇ ǝsoʅɔ ǝsaǝʅԀ" ],
  [ "%(aWebsite)s uses Persona to sign you in!",
    "¡uı noʎ uƃıs oʇ auosɹǝԀ sǝsn %(aWebsite)s" ],
  [ "<strong>Persona.</strong> Simplified sign-in, built by a non-profit. <a %s>Learn more&rarr;</a>",
    "<a %s>&rarr;ǝɹoɯ uɹaǝ⅂</a> .ʇıɟoɹd-uou a ʎq ʇʅınq ´uı-uƃıs pǝıɟıʅdɯıS <strong>.auosɹǝԀ</strong>" ],
  [ "By proceeding, you agree to %(site)s's <a %(terms)s>Terms</a> and <a %(privacy)s>Privacy Policy</a>.",
    ".<a %(privacy)s>ʎɔıʅoԀ ʎɔaʌıɹԀ</a> pua <a %(terms)s>sɯɹǝ⊥</a> s,%(site)s oʇ ǝǝɹƃa noʎ ´ƃuıpǝǝɔoɹd ʎԐ" ]
];

var success = 0;

tests.forEach(function(t) {
  var translated = gobbledygook(t[0]);
  if (translated !== t[1]) {
    console.log("failure!  expected:", t[1]);
    console.log("               got:", translated);
  } else {
    success++;
  }
});

console.log(success + "/" + tests.length + " tests pass");
process.exit((success === tests.length) ? 0 : 1);
