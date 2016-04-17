#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const request = require('request');
const cheerio = require('cheerio');
const program = require('commander');

program
  .version('0.0.0')
  .option('-u, --username [username]', 'username')
  .option('-r, --repository [org/name]', 'repository')
  .parse(process.argv);

if (!program.username || !program.repository) {
  program.outputHelp();
  return;
}

const repoUrl = 'https://github.com/' + program.repository;
const userPullRequestsPage = repoUrl + '/pulls/' + program.username;

request(userPullRequestsPage, (err, response, html) => {
  if (err || response.statusCode != 200) {
    console.log('requesting ' + userPullRequestsPage);
    console.log(chalk.red('invalid repo / username?'));
    return;
  }
  var $ = cheerio.load(html);
  $('a.issue-title-link').each((id, elem) => {
    var link = 'https://github.com' + $(elem).attr('href');
    var title = $(elem).text().trim();
    getPrTravisStatus(link);
  });
});

function getPrTravisStatus(url) {
  request(url, (err, response, html) => {
    if (err || response.statusCode != 200) {
      throw err;
    }
    var $ = cheerio.load(html);
    var title = $('span[class="js-issue-title"]').text();
    var result;
    if (html.indexOf('The Travis CI build passed') != -1) {
      result = chalk.green('build passed');
    } else if (html.indexOf('The Travis CI build failed') != -1) {
      result = chalk.red('build failed');
    } else {
      result = chalk.blue('unknown');
    }
    console.log(title + ': ' + result);
  });
}

