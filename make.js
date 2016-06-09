#!/usr/bin/env node

var fs = require("fs");
var child_process = require("child_process");

var indexData = fs.readFileSync("index.html").toString();


function genFont(imgId, fontPath) {
    var fontData = fs.readFileSync(fontPath).toString("base64");
    var imgTag = '<img id="' + imgId + '" style="display: none" src="data:image/png;base64,' + fontData + '">';
    indexData = indexData.replace(new RegExp("<img.*" + imgId + ".*>"), imgTag);
}

function genFonts() {
    genFont("fontImage1", "data/cp437_12x12.png");
    genFont("fontImage2", "data/cp437_8x16_fixedsys.png");
    fs.writeFileSync("index.html", indexData);
}

function build() {
    try {
        fs.mkdirSync("build");
    } catch (e) {
    }
    var items = fs.readdirSync("build");
    for (var i = 0; i < items.length; ++i) {
        fs.unlinkSync("build/" + items[i]);
    }

    var almondData = fs.readFileSync("almond.js").toString();
    var bundleData = fs.readFileSync("bundle.js").toString();
    var resultBundleData = [
        almondData,
        bundleData,
        'require("index");',
        ""
    ].join("\n");
    fs.writeFileSync("build/temp.js", resultBundleData);

    child_process.execSync("java -jar data/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js build/temp.js --js_output_file build/bundle.js");
    fs.unlinkSync("build/temp.js");

    indexData = indexData.replace(/<script.*almond.js.*script>/, "");
    indexData = indexData.replace(/<script.*require.*script>/, "");
    fs.writeFileSync("build/index.html", indexData);
}

function lint() {
    var files = [];
    function findTsFiles(dir) {
        var items = fs.readdirSync(dir);
        for (var i = 0; i < items.length; ++i) {
            var path = dir + "/" + items[i];
            if (fs.lstatSync(path).isDirectory()) {
                findTsFiles(path);
            } else if (path.match(/.+\.ts$/)) {
                files.push(path);
            }
        }
    }
    findTsFiles("src");
    var cmd = "tslint -t verbose " + files.join(" ");
    child_process.execSync(cmd);
}


if (process.argv.length === 3 && process.argv[2] === "lint") {
    lint();
} else if (process.argv.length === 3 && process.argv[2] === "genfonts") {
    genFonts();
} else if (process.argv.length === 2) {
    child_process.execSync("tsc");
    genFonts();
    build();
} else {
    console.log("usage: make.js [lint|genfonts]");
}
