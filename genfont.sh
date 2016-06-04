#!/bin/sh

DATA="data:image/png;base64,$(base64 -w0 font.png)"
FIND="<img.*fontImage.*>"
REPLACE="<img id=\"fontImage\" style=\"display: none\" src=\"$DATA\">"

sed -i'' "s|$FIND|$REPLACE|" ./index.html
