# LessPass PWA

An unofficial PWA for [LessPass](http://lesspass.com) designed mainly
for offline usage, on both mobiles and desktop.

## UI

The UI is very simple, but the header is quite unique:
- Three blocks are initially separated throughout the header,
  and only come together when required inputs are filled in;
  first the website, then the username, and finally the
  master password.
- Letters are also seen on the header, and correspond to the
  charsets used to generate the password. For instance, if
  symbols are disabled in the charsets, then no symbol will
  be shown on the header. If instead all character sets are
  allowed, then there will be one character taken from each set
  on the header (e.g. `E`, `v`, `9` and `&`).
- The border radius of the boxes will change based on the
  counter.
- The color palette of the header will change based on the
  fingerprint of the master password.

Additionally, the password may be clicked to copy it to
the clipboard.
