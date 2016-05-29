#!/bin/sh
find src/ -name "*.ts" | xargs tslint -t verbose
