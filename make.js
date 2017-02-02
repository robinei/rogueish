#!/usr/bin/env node

var fs = require("fs");
var child_process = require("child_process");

var indexData = fs.readFileSync("index.html").toString();


function genFontTag(imgId, fontPath) {
    var fontData = fs.readFileSync(fontPath).toString("base64");
    return '<img id="' + imgId + '" style="display: none" src="data:image/png;base64,' + fontData + '">';
}

function replaceFonts() {
    console.log("Replacing index.html fonts...");
    var fontData = [
        "<!--BEGIN_FONTS-->",
        genFontTag("fontImage1", "data/cp437_12x12.png"),
        genFontTag("fontImage2", "data/cp437_8x16_fixedsys.png"),
        "<!--END_FONTS-->"
    ].join("\n");
    indexData = indexData.replace(/<!--BEGIN_FONTS-->[\s\S]*<!--END_FONTS-->/, fontData);
    fs.writeFileSync("index.html", indexData);
}

function build() {
    console.log("Clearing build/ directory...");
    try {
        fs.mkdirSync("build");
    } catch (e) {
    }
    var items = fs.readdirSync("build");
    for (var i = 0; i < items.length; ++i) {
        fs.unlinkSync("build/" + items[i]);
    }

    console.log("Concatenating build/temp.js...");
    var almondData = fs.readFileSync("data/almond.js").toString();
    var bundleData = fs.readFileSync("data/bundle.js").toString();
    var resultBundleData = [
        almondData,
        bundleData,
        'require("index");',
        ""
    ].join("\n");
    fs.writeFileSync("build/temp.js", resultBundleData);

    console.log("Optimizing build/temp.js -> build/bundle.js...");
    child_process.execSync("java -jar data/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js build/temp.js --js_output_file build/bundle.js");
    fs.unlinkSync("build/temp.js");

    console.log("Writing modified build/index.html...");
    indexData = indexData.replace(/<!--BEGIN_CODE-->[\s\S]*<!--END_CODE-->/, '<script src="bundle.js"></script>');
    indexData = indexData.replace(/<!--[\s\S]*?-->/g, ""); // remove comments
    indexData = indexData.replace(/^\s*[\r\n]/gm, ""); // remove empty lines
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
} else if (process.argv.length === 3 && process.argv[2] === "fonts") {
    replaceFonts();
} else if (process.argv.length === 2) {
    console.log("Compiling TypeScript code to data/bundle.js...");
    child_process.execSync("tsc");
    replaceFonts();
    build();
} else {
    console.log("usage: make.js [lint|fonts]");
}
