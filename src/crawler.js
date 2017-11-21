(function(module)
{

    'use strict';

    var util = require('util');
    var URL = require('url');
    var Crawler = require('crawler');
    var EventEmitter = require('events').EventEmitter;

    var m = function(baseurl, module_callback)
    {

        EventEmitter.call(this);
        var urls = [];
        var crawler = new Crawler({
            maxConnections: 10,
            callback: _onCrawled.bind(this)
        });

        crawler.on('drain', _onAllCrawled.bind(this));

        /**
         * Starts crawling
         */
        this.crawl = function()
        {
            crawler.queue(baseurl.href);
        };

        /**
         * Processes a crawled page
         * If it's an HTML document, checks each <a> and appends new URLs to the crawler queue
         * @param error
         * @param result
         * @param done
         */
        function _onCrawled(error, result, done)
        {
            if (error)
            {
                this.emit('fetch', error, null);
                return done();
            }
            if (typeof result.$ === 'undefined' || urls.indexOf(result.request.uri.href) > -1)
            {
                return done();
            }
            this.emit('fetch', null, result.request.uri.href);
            urls.push(result.request.uri.href);
            result.$('a').each(function(index, a)
            {
                let url = result.$(a).attr('href');
                url = typeof url !== 'undefined' ? url.replace(/#[^#]*$/, '') : null;
                url = url ? URL.resolve(result.request.uri.href, url) : null;
                if (url !== null && urls.indexOf(url) === -1 && _startsWithBaseURL(url))
                {
                    crawler.queue(url);
                }
            });
            done();
        }

        /**
         * Returns the list of URLs when crawling is done
         */
        function _onAllCrawled()
        {
            module_callback(urls);
        }

        /**
         * Checks if the given URL begins with the base URL (the one providden to start the crawler)
         * @param url
         * @return bool
         */
        function _startsWithBaseURL(url)
        {
            var base = baseurl.href.replace(/^https?:\/\//, '').replace(/^\/\//, '');
            url = url.replace(/^https?:\/\//, '').replace(/^\/\//, '');
            return url.search(base) === 0;
        }

    };
    util.inherits(m, EventEmitter);

    module.exports = m;

})(module);
