const core = require('@actions/core');
const run = require('./run');

const NODE_ENV = process.env['NODE_ENV'];

// If you want to run it locally, set the environment variables like `$ export SOME_TOKEN=<your token>`
const SLACK_TOKEN = process.env['SLACK_TOKEN'];
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

let input;
if (NODE_ENV != 'local') {
  input = {
    slackToken: core.getInput('slack-token', { required: true }),
    channel: core.getInput('channel', { required: true }),
    subscribePulls: core.getInput('subscribe-pulls'),
    subscribeIssues: core.getInput('subscribe-issues'),
    subscribeReviews: core.getInput('subscribe-reviews'),
    subscribePullComments: core.getInput('subscribe-pull-comments'),
    subscribeIssueComments: core.getInput('subscribe-issue-comments'),
    pullOpenMessage: core.getInput('pull-open-message'),
    pullReopenMessage: core.getInput('pull-reopen-message'),
    pullDraftOpenMessage: core.getInput('pull-draft-open-message'),
    pullDraftReopenMessage: core.getInput('pull-draft-reopen-message'),
    pullReadyMessage: core.getInput('pull-ready-message'),
    pullCloseMessage: core.getInput('pull-close-message'),
    pullMergeMessage: core.getInput('pull-merge-message'),
    pullCommentMessage: core.getInput('pull-comment-message'),
    issueOpenMessage: core.getInput('issue-open-message'),
    issueReopenMessage: core.getInput('issue-reopen-message'),
    issueCloseMessage: core.getInput('issue-close-message'),
    issueCommentMessage: core.getInput('issue-comment-message'),
    reviewApproveMessage: core.getInput('review-approve-message'),
    reviewRequestChangesMessage: core.getInput('review-request-changes-message'),
    reviewCommentMessage: core.getInput('review-comment-message'),
    appName: core.getInput('app-name'),
    appIcon: core.getInput('app-icon'),
    footer: core.getInput('footer'),
    footerIcon: core.getInput('footer-icon'),
    threadingComments: core.getInput('threading-comments'),
    eventName: core.getInput('event-name'),
    event: core.getInput('event'),
    githubToken: core.getInput('github-token'),
  };
} else {
  const event = {
    action: 'reopened',
    pull_request: {
      number: 2,
      title: 'pull request title',
      html_url: 'https://github.com/hkusu/slack-integration-test/pull/2',
      body: 'pull request body',
      draft: false,
      merged: true,
      user: {
        login: 'hkusu',
      },
    },
    review: {
      body: 'review body',
      html_url: 'https://github.com/hkusu/slack-integration/pull/1',
      id: 651204777,
      state: 'approved',
    },
    issue: {
      number: 99,
      title: 'issue title',
      html_url: 'https://github.com/hkusu/slack-integration/pull/1',
      body: 'issue body',
      user: {
        login: 'hkusu',
      },
    },
    comment: {
      id: 831946275,
      body: 'comment body',
      html_url: 'https://hkusu/slack-integration/pull/1',
    },
    repository: {
      full_name: 'hkusu/slack-integration-test',
      html_url: 'https://github.com/hkusu/slack-integration-test',
      owner: {
        avatar_url: 'https://github.com/hkusu.png',
      },
    },
    sender: {
      login: 'hkusu',
      html_url: 'https://github.com/hkusu',
      avatar_url: 'https://github.com/hkusu.png',
    }
  };
  input = {
    slackToken: SLACK_TOKEN,
    channel: 'github_test',
    subscribePulls: 'true',
    subscribeIssues: 'true',
    subscribeReviews: 'true',
    subscribePullComments: 'true',
    subscribeIssueComments: 'true',
    pullOpenMessage: 'Pull request opened by <actor>',
    pullReopenMessage: 'Pull request reopened by <actor>',
    pullDraftOpenMessage: 'Pull request opened by <actor>',
    pullDraftReopenMessage: 'Pull request reopened by <actor>',
    pullReadyMessage: 'Pull request ready for review by <actor>',
    pullCloseMessage: 'Pull request closed by <actor>',
    pullMergeMessage: 'Pull request merged by <actor>',
    pullCommentMessage: '',
    issueOpenMessage: 'Issue opened by <actor>',
    issueReopenMessage: 'Issue reopened by <actor>',
    issueCloseMessage: 'Issue closed by <actor>',
    issueCommentMessage: '',
    reviewApproveMessage: '<actor> approved <author>\'s pull request',
    reviewRequestChangesMessage: '<actor> requested changes on <author>\'s pull request',
    reviewCommentMessage: '<actor> commented on <author>\'s pull request',
    appName: 'GitHub',
    appIcon: '',
    footer: '<https://github.com/hkusu/slack-integration|hkusu/slack-integration>',
    footerIcon: 'https://github.com/hkusu.png',
    threadingComments: 'true',
    eventName: 'pull_request',
    event: JSON.stringify(event),
    githubToken: GITHUB_TOKEN,
  };
}

run(input)
  .then(result => {
    core.setOutput('result', 'success');
  })
  .catch(error => {
    core.setOutput('result', 'failure');
    core.setFailed(error.message);
  });
