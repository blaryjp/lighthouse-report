# lighthouse-report

Crawls a website or get URLs from a sitemap.xml or a file, gets [Lighthouse](https://github.com/GoogleChrome/lighthouse) data for each page, and exports an HTML report.

---

* [Installation](#installation)
* [CLI usage](#cli-usage)
* [Programmatic usage](#programmatic-usage)
* [Crawler behavior](#crawler-behavior)
* [Changelog](#changelog)
* [License](#license)
* [Credits](#credits)

## Installation

Install with [npm](https://www.npmjs.com/):

```bash
$ npm install lighthouse-report --global
# --global isn't required if you plan to use the node module
```

## CLI usage

```bash
$ lighthouse-report [options] <url> <dest_path>
```

Options:

```bash
    -V, --version               output the version number
    --urls-from-sitemap [name]  Get the list of URLs from sitemap.xml (don't crawl)
    --urls-from-file [name]     Get the list of URLs from a file, one url per line (don't crawl)
    -h, --help                  output usage information
```

Example:

```bash
$ lighthouse-report daringfireball.net/projects/markdown $PWD/report
```

## Programmatic usage

```javascript
// Basic usage

var LighthouseReport = require('lighthouse-report');
var lighthouse_report = new LighthouseReport({baseurl: 'http://domain.org'}, onComplete);
reporter.start();

function onComplete(baseurl, data, html)
{
    console.log('Report for: ' + baseurl);
    console.log(data); // An array of pages with their Lighthouse results
    console.log(html); // The HTML report (as a string)
}

// The "fetch_url" and "fetch_lighthouse" events allow to monitor the crawling process

lighthouse_report.on('fetch_url', onFetchURL);
function onFetchURL(error, url)
{
    console.log((error ? 'Error with URL: ' : 'Fetched URL: ') + url);
}

lighthouse_report.on('fetch_lighthouse', onFetchLighthouse);
function onFetchLighthouse(error, url)
{
    console.log((error ? 'Error with Lighthouse for ' : 'Lighthouse data fetched for ') + url);
}
```

## Crawler behavior

The base URL is used as a root when crawling the pages.

For instance, using the URL `https://daringfireball.net/` will crawl the entire website.

However, `https://daringfireball.net/projects/markdown/` will crawl only:

* `https://daringfireball.net/projects/markdown/`
* `https://daringfireball.net/projects/markdown/basics`
* `https://daringfireball.net/projects/markdown/syntax`
* `https://daringfireball.net/projects/markdown/license`
* And so on

*This may be useful to crawl only one part of a website: everything starting with `/en`, for instance.*

## URLs from a sitemap.xml or a file

Instead of crawling the website, you can set the URL list with a sitemap.xml or a file.

* `--urls-from-sitemap https://example.com/sitemap.xml`
* `--urls-from-file /path/to/urls.txt`

Only the URLs inside this file will be processed.

## Changelog

This project uses [semver](http://semver.org/).

| Version | Date | Notes |
| --- | --- | --- |
| `1.0.0` | 2017-11-21 | Initial version |

## License

This project is released under the [MIT License](license.md).

## Credits

This project is based on the great work of johansatge (https://github.com/johansatge/psi-report).

* [async](https://github.com/caolan/async)
* [colors](https://github.com/Marak/colors.js)
* [request](https://github.com/request/request)
* [crawler](https://github.com/sylvinus/node-crawler)
* [commander](https://github.com/tj/commander.js)
* [sitemapper](https://github.com/hawaiianchimp/sitemapper)
* [lighthouse](https://github.com/GoogleChrome/lighthouse)
* [lodash](https://github.com/lodash/lodash)
* [shelljs](https://github.com/shelljs/shelljs)
