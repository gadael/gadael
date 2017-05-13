/* lloyd|2012|http://wtfpl.org */

(function() {
  // split a string using a regex, do it in a way that doesn't piss IE8 off
  function resplit(str, re) {
    var arr = [];
    var x = 0;
    var m;
    while ((m = re.exec(str)) != null) {
      if (x < m.index) arr.push(str.substr(x, m.index - x));
      arr.push(m[0]);
      x = m.index + m[0].length;
    }
    if (x < str.length) arr.push(str.substr(x, str.length - x));

    return arr;
  }

  // take a string and turn it into an array of tokens.  Tokens are:
  // 1. text: plain text chunks
  // 2. markers: untranslatable place holders %s or %(name)s
  // 3. containers: like, <a> </a>. things containing text that should be translated,
  //    but the things must retain their order
  function tokenize(str) {
    function splitHTML(str) {
      // Yeah, I'm using regular expressions to process html.  don't look at me like that.
      // the HTML we're processing MUST be used sparingly and only when required to represent
      // boundaries of phrases in larger sentence, where context is important to translators.
      // so don't look at me like that.
      var kill = false;
      var toks = resplit(str, /(<([a-zA-Z]+)(?:\s[^>]*)?>.*?<\/\2>)/g);

      // yay, tokens!  now we need to process the html tokens
      for (var i = 0; i < toks.length; i++) {
        if (toks[i][0] = '<') {
          var m = /^(<[^>]*>)(.*)(<\/[^>]*>)$/.exec(toks[i]);
          if (m) toks[i] = { t: 'container', b: m[1], e: m[3], v: splitHTML(m[2]) };
        }
      }
      return toks;
    }
    var toks = splitHTML(str);

    // now let's find markers
    function splitMarkers(arr) {
      for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'string') {
          var splt = resplit(arr[i], /(&[a-zA-Z]+;|&#[0-9]+;|%s|%\([^)]+\)s)/g);
          arr.splice(i--, 1);
          while (splt.length) {
            var x = splt.shift();
            if (x[0] === '%' || x[0] === '&') x = { t: 'marker', v: x };
            arr.splice(++i, 0, x);
          }
        }
        else {
          splitMarkers(arr[i].v);
        }
      }
    }
    splitMarkers(toks);

    return toks;
  }

  // take a token array and turn it into a translated string, inverting the order
  function stringify(toks) {
    var str = "";
    for (var i = toks.length - 1; i >= 0; i--) {
      if (typeof toks[i] === 'string') str += toks[i];
      else if (toks[i].t == 'marker') str += toks[i].v;
      else {
        str += toks[i].b + stringify(toks[i].v) + toks[i].e;
      }
    }
    return str;
  }

  var from = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+\\|`~[{]};:'\",<.>/?";
  var to =   "ɐqɔpǝɟƃɥıɾʞʅɯuodbɹsʇnʌʍxʎz∀ԐↃᗡƎℲ⅁HIſӼ⅂WNOԀÒᴚS⊥∩ɅＭX⅄Z0123456789¡@#$%ᵥ⅋⁎()-_=+\\|,~[{]};:,„´<.>/¿";

  // translate a single string, inverting it as well
  function translateString(str) {
    var trans = "";
    for (var i = str.length - 1; i >= 0; i--) {
      var ix = from.indexOf(str.charAt(i));
      if (ix > 0) trans += to[ix];
      else trans += str[i];
    }
    return trans;
  }

  function translateToks(toks) {
    for (var i = 0; i < toks.length; i++) {
      if (typeof toks[i] === 'string') toks[i] = translateString(toks[i]);
      else if (toks[i].t === 'container') {
        if (typeof toks[i].v === 'string') toks[i].v = translateString(toks[i].v);
        else translateToks(toks[i].v);
      }
    }
  }

  // translate a string
  var gg = function(str) {
    var toks = tokenize(str);
    translateToks(toks);
    return stringify(toks);
  };

  if (typeof module !== 'undefined') module.exports = gg;
  else window.Gobbledygook = gg;
})();
