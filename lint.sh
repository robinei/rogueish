#!/bin/sh
find . -name "*.ts" | xargs tslint -t verbose
