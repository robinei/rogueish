#!/bin/sh

DATA1="data:image/png;base64,$(base64 -w0 data/cp437_12x12.png)"
FIND1="<img.*fontImage1.*>"
REPLACE1="<img id=\"fontImage1\" style=\"display: none\" src=\"$DATA1\">"
sed -i'' "s|$FIND1|$REPLACE1|" ./index.html

DATA2="data:image/png;base64,$(base64 -w0 data/cp437_8x16_fixedsys.png)"
FIND2="<img.*fontImage2.*>"
REPLACE2="<img id=\"fontImage2\" style=\"display: none\" src=\"$DATA2\">"
sed -i'' "s|$FIND2|$REPLACE2|" ./index.html
