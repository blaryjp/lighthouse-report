#!/usr/bin/env node

(function(process)
{

    'use strict';

    var fs = require('fs');
    var colors = require('colors');
    var program = require('commander');

    var LighthouseReport = require('./main.js');

    var manifest = require('../package.json');

    program
        .version(manifest.version)
        .description('Crawls a website or get URLs from a sitemap.xml or a file, gets Lighthouse data for each page, and exports an HTML report.')
        .usage('[options] <url> <dest_path>')
        .option('--urls-from-sitemap [name]', 'Get the list of URLs from sitemap.xml (don\'t crawl)')
        .option('--urls-from-file [name]', 'Get the list of URLs from a file, one url per line (don\'t crawl)')
        .parse(process.argv);

    // ERROR: no base-url, or no output file
    if (program.args.length !== 2) {
        program.outputHelp(colors.red);
        process.exit(1);
    }

    var outputPath = program.args[1];

    var lighthouse_report = new LighthouseReport({
        baseurl: program.args[0],
        urlsFromFile: program.urlsFromFile,
        urlsFromSitemap: program.urlsFromSitemap,
        outputPath: outputPath
    }, _onComplete);
    lighthouse_report.on('fetch_url', _onFetchURL);
    lighthouse_report.on('fetch_lighthouse', _onFetchLighthouse);
    lighthouse_report.start();

    /**
     * Fetched an URL
     * @param error
     * @param url
     */
    function _onFetchURL(error, url)
    {
        url = colors.underline(url);
        console.log(error ? colors.yellow('Fetch error on ' + url + ' (' + error.message + ')') : 'Found ' + url);
    }

    /**
     * Fetched an Insight
     * @param error
     * @param url
     */
    function _onFetchLighthouse(error, url)
    {
        url = colors.underline(url);
        console.log(error ? colors.yellow('Lighthouse error on ' + url + ' (' + error.message + ')') : 'Got Lighthouse data for ' + url);
    }

    /**
     * Builds the HTML document when crawling is done
     * @param baseurl
     * @param data
     * @param html
     */
    function _onComplete(baseurl, data, html)
    {
        if (data.length === 0)
        {
            console.log(colors.red('No pages found'));
            process.exit(1);
        }
        fs.writeFile(`${outputPath}/index.html`, html, {encoding: 'utf8'}, function(error)
        {
            console.log(error ? colors.red('Write error (' + error.message + ')') : colors.green('Report saved'));
            process.exit(error ? 1 : 0);
        });
    }

})(process);
