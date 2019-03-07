(function(module)
{
    'use strict';

    require('shelljs/global');
    const fs = require('fs');
    const _ = require('lodash');
    const path = require('path')
    var util = require('util');
    var async = require('async');
    var EventEmitter = require('events').EventEmitter;

    var m = function(baseurl, urls, params, module_callback)
    {
        var results = [];
        EventEmitter.call(this);

        const dist = path.resolve(`${params.outputPath}`);
        const distLighthouse = path.resolve(`${dist}/lighthouse`);
        const lhc = lighthouseCmd();

        rm('-rf', dist);
        mkdir('-p', distLighthouse);

        function lighthouseCmd() {
          let cliPath = path.resolve(`${__dirname}/../node_modules/lighthouse/lighthouse-cli/index.js`)
          if (!fs.existsSync(cliPath)) {
            cliPath = path.resolve(`${__dirname}/../lighthouse/lighthouse-cli/index.js`)
            if (!fs.existsSync(cliPath)) {
              console.error(`Faild to find Lighthouse CLI, aborting.`)
              process.exit(1)
            }
          }
          return cliPath
        }

        /**
         * Starts crawling
         * Runs only 3 concurrent tasks (using more may result in hitting the API rate limit)
         */
        this.crawl = function()
        {
            var lighthouse_queue = async.queue(_getLighthouseData.bind(this), 3);
            lighthouse_queue.drain = _onLighthouseQueueDone.bind(this);
            urls = _.uniq(urls);
            for (var index = 0; index < urls.length; index += 1) {
                if (urls[index]) {
                    lighthouse_queue.push({url: urls[index]});
                }
            }
        };

        /**
         * Fires the Google Lighhouse and parses the result
         * @param task
         * @param callback
         */
        var _getLighthouseData = function(task, callback)
        {
            var self = this;

            const filename = _.snakeCase(task.url);
            const outputPath = `${distLighthouse}/${filename}`;

            const cmd = `${task.url} --quiet --output="json" --output="html" --output-path="${outputPath}" --chrome-flags="--headless --disable-gpu --no-sandbox --ignore-certificate-errors"`

            exec(`${lhc} ${cmd}`, { async: true }, (code, stdout, stderr) => {
                if (code > 0) {
                    self.emit('fetch', new Error('Exec error ' + code), task.url);
                    return callback();
                }
                results.push({
                    url: task.url,
                    filename: {
                        json: `${filename}.report.json`,
                        html: `${filename}.report.html`
                    },
                    infos: _parseData(`${outputPath}.report.json`)
                });
                self.emit('fetch', null, task.url);
                return callback();
            });
        };

        /**
         * Returns the results as an array
         */
        var _onLighthouseQueueDone = function()
        {
            module_callback(_.sortBy(results, "url"));
        };

        /**
         * Parses Lighthouse data
         * @param jsonFile
         * @return object
         */
        var _parseData = function(jsonFile)
        {
            let data = require(jsonFile);

            let pwa = _.find(data.categories, { 'id': 'pwa' });
            let performance = _.find(data.categories, { 'id': 'performance' });
            let accessibility = _.find(data.categories, { 'id': 'accessibility' });
            let bestpractices = _.find(data.categories, { 'id': 'best-practices' });
            let seo = _.find(data.categories, { 'id': 'seo' });

            pwa.score = Math.round(pwa.score * 100);
            performance.score = Math.round(performance.score * 100);
            accessibility.score = Math.round(accessibility.score * 100);
            bestpractices.score = Math.round(bestpractices.score * 100);
            seo.score = Math.round(seo.score * 100);

            // Returns relevant data only
            return {
                performance: {
                    score: performance.score,
                    keyword: performance.score >= 50 ? (performance.score >= 90 ? 'green' : 'orange') : 'red'
                },
                pwa: {
                    score: pwa.score,
                    keyword: pwa.score >= 50 ? (pwa.score >= 90 ? 'green' : 'orange') : 'red'
                },
                accessibility: {
                    score: accessibility.score,
                    keyword: accessibility.score >= 50 ? (accessibility.score >= 90 ? 'green' : 'orange') : 'red'
                },
                bestpractices: {
                    score: bestpractices.score,
                    keyword: bestpractices.score >= 50 ? (bestpractices.score >= 90 ? 'green' : 'orange') : 'red'
                },
                seo: {
                    score: seo.score,
                    keyword: seo.score >= 50 ? (seo.score >= 90 ? 'green' : 'orange') : 'red'
                }
            };
        };

    };
    util.inherits(m, EventEmitter);

    module.exports = m;

})(module);
