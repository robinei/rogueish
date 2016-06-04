#!/bin/sh

mkdir -p build
rm -f build/*

tsc || exit 1

sh genfont.sh

cat almond.js bundle.js > build/temp.js
cat >> build/temp.js << EOF

// blank line above is important
require("index");
EOF

java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js build/temp.js --js_output_file build/bundle.js
rm build/temp.js

cp index.html build/
sed -i'' '/<script.*almond.js.*script>/d' ./build/index.html
sed -i'' '/<script.*require.*script>/d' ./build/index.html
