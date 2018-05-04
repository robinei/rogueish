#!/bin/sh

git fetch
git rebase --onto origin/master gh-pages^^ gh-pages
tsc
git add data/bundle.js
git add data/bundle.js.map
git commit --amend -m "GH-PAGES: regenerated bundle files $(date)"
git push origin gh-pages -f

