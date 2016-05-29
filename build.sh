#!/bin/sh

mkdir -p build
rm -f build/*

tsc || exit 1

cat almond.js bundle.js > build/temp.js
cat >> build/temp.js << EOF

// blank line above is important
require("index");
EOF

java -jar compiler.jar --js build/temp.js --js_output_file build/bundle.js
rm build/temp.js

cp font.png build/
cp index.html build/
sed -i'' '/<script.*almond.js.*script>/d' ./build/index.html
sed -i'' '/<script.*require.*script>/d' ./build/index.html
