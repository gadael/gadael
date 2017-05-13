## A tool for debugging of translations

[![Build Status](https://secure.travis-ci.org/lloyd/gobbledygook.png)](http://travis-ci.org/lloyd/gobbledygook)

This project contains a node.js implementation of "fake translation",
which makes it easier to debug the internationalization of software.

This project was inspired by the [Translate Toolkit](http://translate.sourceforge.net/wiki/toolkit/history).

## Usage

    npm install gobbledygook
    $ node
    > require('gobbledygook')('Hello World!');
    '¡pʅɹoＭ oʅʅǝH'

## What's it do?

This library can algorithmically "translate" your software.  The
translation can be visually scanned to ensure that all user facing
strings are properly substituted with translations.

Our fake translation is a right-to-left, inverted representation of
english.  It uses several unicode characters which resemble 180 degree
rotated versions of their counterparts, and make it look like all the
strings are upside down and backwards - you can still read it, but is 
is very clear what text is properly translated and what is not (suggesting
an i18n bug).

Concretely, we test a couple different things at once here:

  1. rendering of R-T-L languages
  2. string extraction / string markup
  3. the substitution system and its ability to allow translators to reposition
     things (like move the privacy policy before the terms and we still sub links right)

## Some details

This implementation supports basic HTML markup, HTML entities, and substitution markers.

Because we directly use very simple html in strings we expose
to translators, this thing has to understand very basic html.  Here's a concrete
example:

  * **real** - Please close this window, <a %s>enable cookies</a> and try again
  * **fake** - uıaƃa ʎɹʇ pua <a %s>sǝıʞooɔ ǝʅqauǝ</a> ´ʍopuıʍ sıɥʇ ǝsoʅɔ ǝsaǝʅԀ

notice that the text within the full sentence must be inverted, however HTML
tags must not be.

This implementation handles substitution markers such as `%s` and
`%(name)` in translatable strings as placeholders where dynamically
generated content (links, email addresses, website names, etc) will be
placed.  Needless to say, if `%(cookieLink)` is translated to
`)ʞuı⅂ǝıʞooɔ(%`, substitution will be broken.  This implementation
respects these types of markers, and is currently hardcoded to only
this style of substitution marker, but could be generalized.

## The license

http://wtfpl.org
