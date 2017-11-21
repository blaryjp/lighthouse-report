(function(module)
{

    'use strict';

    var fs = require('fs');
    var util = require('util');
    var url = require('url');
    var EventEmitter = require('events').EventEmitter;
    var Sitemapper = require('sitemapper');

    var Crawler = require('./crawler.js');
    var Lighthouse = require('./lighthouse.js');
    var html_report = require('./html_report.js');

    var m = function(params, module_callback)
    {

        EventEmitter.call(this);
        var baseurl = false;
        if (typeof params.baseurl !== 'undefined')
        {
            baseurl = url.parse(params.baseurl.search(/https?:\/\//) !== -1 ? params.baseurl : 'http://' + params.baseurl);
        }

        /**
         * Checks if the given URL begins with the base URL
         * @param url
         * @return bool
         */
        function _startsWithBaseURL(url)
        {
            var base = baseurl.href.replace(/^https?:\/\//, '').replace(/^\/\//, '');
            url = url.replace(/^https?:\/\//, '').replace(/^\/\//, '');
            return url.search(base) === 0;
        }

        /**
         * Starts the main process
         */
        this.start = function()
        {
            if (baseurl === false)
            {
                module_callback(baseurl, []);
                return;
            }

            if (params.urlsFromSitemap)
            {
                var sitemap = new Sitemapper();
                sitemap.fetch(params.urlsFromSitemap).then((function (data) {
                    _onCrawlerComplete.bind(this)(data && data.sites || []);
                }).bind(this));
            }
            else if (params.urlsFromFile)
            {
                var urlsFromFile = fs.readFileSync(params.urlsFromFile).toString().split("\n");
                urlsFromFile = urlsFromFile.map((u) => _startsWithBaseURL(u) ? u : `${baseurl.href}${u.replace(/^\//, '')}`);
                _onCrawlerComplete.bind(this)(urlsFromFile);
            }
            else
            {
                var crawler = new Crawler(baseurl, _onCrawlerComplete.bind(this));
                crawler.on('fetch', _onCrawledURL.bind(this));
                crawler.crawl();
            }
        };

        /**
         * Fetched an URL with the crawler
         * @param error
         * @param url
         * @private
         */
        var _onCrawledURL = function(error, url)
        {
            this.emit('fetch_url', error, url);
        };

        /**
         * Crawling complete, starts getting Lighthouse data
         * @param urls
         */
        var _onCrawlerComplete = function(urls)
        {
            if (urls.length === 0)
            {
                module_callback(baseurl, []);
                return;
            }
            var lighthouse = new Lighthouse(baseurl, urls, params, _onGotLighthouseResults.bind(this));
            lighthouse.on('fetch', _onGotLighthouseResult.bind(this));
            lighthouse.crawl();
        };

        /**
         * Got the Lighthouse data for one URL
         * @param error
         * @param url
         */
        var _onGotLighthouseResult = function(error, url)
        {
            this.emit('fetch_lighthouse', error, url);
        };

        /**
         * Sends the result back when all Lighthouse results have been fetched
         * @param results
         */
        var _onGotLighthouseResults = function(results)
        {
            html_report(baseurl.href, results, function(html)
            {
                module_callback(baseurl.href, results, html);
            });
        };

    };
    util.inherits(m, EventEmitter);

    module.exports = m;

})(module);
