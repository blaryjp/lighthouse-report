(function(module, cwd)
{

    'use strict';

    var fs = require('fs');
    var os = require('os');
    var async = require('async');


    /**
     * Builds a HTML report
     * @param url
     * @param data
     * @param module_callback
     */
    var m = function(url, data, module_callback)
    {
        var loaders = {
            report: function(callback)
            {
                fs.readFile(cwd + '/templates/report.html', {encoding: 'utf8'}, function(error, html)
                {
                    callback(null, html);
                });
            },
            item: function(callback)
            {
                fs.readFile(cwd + '/templates/item.html', {encoding: 'utf8'}, function(error, html)
                {
                    callback(null, html);
                });
            }
        };
        async.parallel(loaders, _onTemplatesLoaded);

        /**
         * Builds the report when both templates have been loaded
         * @param error
         * @param templates
         */
        function _onTemplatesLoaded(error, templates)
        {
            var html = templates.report;
            data.map(function(page)
            {
                html = html.replace('<!--results-->', _buildItem(templates.item, page) + '<!--results-->');
            });
            html = html.replace(new RegExp('{{url}}', 'g'), url);
            module_callback(html);
        }

        /**
         * Builds an item (see item.html)
         * @param template
         * @param data
         * @returns string
         */
        function _buildItem(template, data)
        {
            template = template.replace(new RegExp('{{url}}', 'g'), data.url);
            template = template.replace(new RegExp('{{encoded_url}}', 'g'), encodeURIComponent(data.url));

            template = template.replace(new RegExp('{{filename.html}}', 'g'), data.filename.html);
            template = template.replace(new RegExp('{{infos.score.score}}', 'g'), data.infos.score.score);
            template = template.replace(new RegExp('{{infos.score.keyword}}', 'g'), data.infos.score.keyword);

            return template.replace(/{{[a-z._]+}}/g, '--');
        }

    };

    module.exports = m;

})(module, __dirname);
