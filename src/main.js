const core = require('@actions/core');
const axios = require('axios');
const mrkdwn = require('html-to-mrkdwn');

const NODE_ENV = process.env['NODE_ENV'];

// If you want to run it locally, set the environment variables like `$ export SLACK_TOKEN=<your token>`
const SLACK_TOKEN = process.env['SLACK_TOKEN'];

// If you want to run it locally, set the environment variables like `$ export GITHUB_TOKEN=<your token>`
const GITHUB_TOKEN = process.env['GITHUB_TOKEN'];

const SLACK_API_BASE_URL = 'https://slack.com/api';
const GITHUB_API_BASE_URL = 'https://api.github.com';

const COLOR = {
  BASE_BLACK: '#24292f',
  OPEN_GREEN: '#36a64f',
  MERGED_PURPLE: '#6f42c1',
  CLOSED_RED: '#cb2431',
  DRAFT_GRAY: '#6a737d',
};

let input;
if (NODE_ENV != 'local') {
  input = {
    slackToken: core.getInput('slack-token', { required: true }),
    channel: core.getInput('channel', { required: true }),
    pulls: core.getInput('pulls'),
    issues: core.getInput('issues'),
    reviews: core.getInput('reviews'),
    comments: core.getInput('comments'),
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
    eventName: core.getInput('event-name'),
    event: core.getInput('event'),
    githubToken: core.getInput('github-token'),
  };
} else {
  const event = {
    action: "opened",
    pull_request: {
      number: 2,
      title: 'pull request title',
      html_url: 'https://github.com/hkusu/slack-integration/pull/1',
      body: 'pull request body',
      draft: false,
      merged: true,
      user: {
        login: 'hkusu',
      },
    },
    review: {
      body: "review body",
      html_url: "https://github.com/hkusu/slack-integration/pull/1",
      id: 999,
      state: "approved",
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
      body: "comment body",
      html_url: "https://hkusu/slack-integration/pull/1",
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
    channel: 'my-greeting-channel',
    pulls: 'true',
    issues: 'true',
    reviews: 'true',
    comments: 'true',
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
    eventName: 'pull_request',
    event: JSON.stringify(event),
    githubToken: GITHUB_TOKEN,
  };
}

async function run(input) {

  try {
    input.event = JSON.parse(input.event);
  } catch (e) {
    throw new Error('JSON parse error. "event" input is invalid.');
  }

  if (!input.event.repository) {
    throw new Error('"event" input is invalid.');
  }

  switch (input.eventName) {
    case 'pull_request':
      await handlePullRequest(input);
      break;
    case 'issues':
      await handleIssues(input);
      break;
    case 'pull_request_review':
      await handlePullRequestReview(input);
      await handlePullRequestReviewComment(input);
      break;
    case 'issue_comment':
      await handleIssueComment(input);
      break;
    default:
  }
}

async function handlePullRequest(input) {

  if (input.pulls != 'true') return;

  const message = getDefaultMessage();

  message.title = `#${input.event.pull_request.number} ${input.event.pull_request.title}`;
  message.titleLink = input.event.pull_request.html_url;

  switch (input.event.action) {
    case 'opened':
      if (input.event.pull_request.draft) {
        message.description = input.pullDraftOpenMessage;
        message.color = COLOR.DRAFT_GRAY;
      } else {
        message.description = input.pullOpenMessage;
        message.color = COLOR.OPEN_GREEN;
      }

      let pullRequest;
      try {
        const res = await axios({
          url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/pulls/${input.event.pull_request.number}`,
          headers: {
            'Accept': 'application/vnd.github.3.html+json', // Required to get html
            'Authorization': `token ${input.githubToken}`,
          },
        });
        pullRequest = res.data
      } catch (e) {
        throw new Error(`GitHub API error (message: ${e.message}).`);
      }

      const { text, image } = mrkdwn(pullRequest.body_html);
      message.body = text;
      message.image = image;

      break;
    case 'reopened':
      if (input.event.pull_request.draft) {
        message.description = input.pullDraftReopenMessage;
        message.color = COLOR.DRAFT_GRAY;
      } else {
        message.description = input.pullReopenMessage;
        message.color = COLOR.OPEN_GREEN;
      }
      break;
    case 'ready_for_review':
      message.description = input.pullReadyMessage;
      message.color = COLOR.OPEN_GREEN;
      break;
    case 'closed':
      if (input.event.pull_request.merged) {
        message.description = input.pullMergeMessage;
        message.color = COLOR.MERGED_PURPLE;
      } else {
        message.description = input.pullCloseMessage;
        message.color = COLOR.CLOSED_RED;
      }
      break;
    default:
      return;
  }

  await post2Slack(input, message);
}

async function handleIssues(input) {

  if (input.issues != 'true') return;

  const message = getDefaultMessage();

  message.title = `#${input.event.issue.number} ${input.event.issue.title}`;
  message.titleLink = input.event.issue.html_url;

  switch (input.event.action) {
    case 'opened':
      message.description = input.issueOpenMessage;
      message.color = COLOR.OPEN_GREEN;
      message.body = input.event.issue.body;
      break;
    case 'reopened':
      message.description = input.issueReopenMessage;
      message.color = COLOR.OPEN_GREEN;
      break;
    case 'closed':
      message.description = input.issueCloseMessage;
      message.color = COLOR.CLOSED_RED;
      break;
    default:
      return;
  }

  await post2Slack(input, message);
}

async function handlePullRequestReview(input) {

  if (input.reviews != 'true') return;

  const message = getDefaultMessage();

  message.title = `Review on #${input.event.pull_request.number} ${input.event.pull_request.title}`;
  message.titleLink = input.event.review.html_url;
  message.body = input.event.review.body;

  switch (input.event.action) {
    case 'submitted':
      switch (input.event.review.state) {
        case 'approved':
          message.description = input.reviewApproveMessage;
          message.color = COLOR.OPEN_GREEN;
          break;
        case 'changes_requested':
          message.description = input.reviewRequestChangesMessage;
          message.color = COLOR.CLOSED_RED;
          break;
        case 'commented':
          // Do not post if there is no message
          if (!message.body) return;
          message.description = input.reviewCommentMessage;
          break;
        default:
          return;
      }
      break;
    default:
      return;
  }

  await post2Slack(input, message);
}

/*
  Don't use 'pull_request_review_comment' events, uselessly launch GitHub Actions work flows.
*/
async function handlePullRequestReviewComment(input) {

  if (input.comments != 'true') return;

  if (input.event.action != 'submitted') return;

  let comments;
  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/pulls/${input.event.pull_request.number}/reviews/${input.event.review.id}/comments`,
      headers: {
        'Authorization': `token ${input.githubToken}`,
      },
    });
    comments = res.data
  } catch (e) {
    throw new Error(`GitHub API error (message: ${e.message}).`);
  }

  for (const comment of comments) {
    const message = getDefaultMessage();
    message.title = `Comment on #${input.event.pull_request.number} ${input.event.pull_request.title}`;
    message.titleLink = comment.html_url;
    message.body = comment.body;
    await post2Slack(input, message);
  }
}

async function handleIssueComment(input) {

  if (input.comments != 'true') return;

  const message = getDefaultMessage();

  switch (input.event.action) {
    case 'created':
      if (input.event.issue.pull_request) {
        message.description = input.pullCommentMessage;
      } else {
        message.description = input.issueCommentMessage;
      }
      message.title = `Comment on #${input.event.issue.number} ${input.event.issue.title}`;
      message.titleLink = input.event.comment.html_url;
      message.body = input.event.comment.body;
      break;
    default:
      return;
  }

  await post2Slack(input, message);
}

function getDefaultMessage() {
  return {
    description: '',
    color: COLOR.BASE_BLACK,
    title: '',
    titleLink: '',
    body: '',
    image: '',
  }
}

async function post2Slack(input, message) {

  const actor = input.event.sender.login;
  message.description = message.description.replace(/<actor>/g, actor);

  let author = '';
  switch (input.eventName) {
    case 'pull_request':
    case 'pull_request_review':
      author = input.event.pull_request.user.login;
      break;
    case 'issues':
    case 'issue_comment':
      author = input.event.issue.user.login;
      break;
    default:
  }
  message.description = message.description.replace(/<author>/g, author)

  const res = await axios({
    method: 'post',
    url: `${SLACK_API_BASE_URL}/chat.postMessage`,
    data: {
      "channel": input.channel,
      "username": input.appName,
      "icon_url": input.appIcon,
      "text": message.description,
      "attachments": [
        {
          "mrkdwn_in": ["text"],
          "color": message.color,
          "author_name": input.event.sender.login,
          "author_link": input.event.sender.html_url,
          "author_icon": input.event.sender.avatar_url,
          "title": message.title,
          "title_link": message.titleLink,
          "text": message.body,
          "image_url": message.image,
          "footer": input.footer,
          "footer_icon": input.footerIcon,
          "ts": Math.floor(new Date().getTime() / 1000),
        }
      ]
    },
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${input.slackToken}`,
    },
  });

  if (!res.data.ok) {
    throw new Error(`Slack API error (message: ${res.data.error}).`);
  }
}

run(input)
  .then(result => {
    core.setOutput('result', 'success');
  })
  .catch(error => {
    core.setOutput('result', 'failure');
    core.setFailed(error.message);
  });
