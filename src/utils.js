const axios = require('axios');
const mrkdwn = require('html-to-mrkdwn');

const GITHUB_API_BASE_URL = 'https://api.github.com';
const SLACK_API_BASE_URL = 'https://slack.com/api';

async function getPullRequest(event, token) {

  let pullRequest;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/pulls/${event.pull_request.number}`,
      headers: {
        'Accept': 'application/vnd.github.3.full+json',
        'Authorization': `token ${token}`,
      },
    });
    pullRequest = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  let bodyHtml = ''
  if (pullRequest.body_html) { // May be null, so make it an empty string
    bodyHtml = pullRequest.body_html;
  }

  const { text: mrkdwnBody, image: mrkdwnImage } = mrkdwn(bodyHtml); // Argument must be a string

  let body = '';
  if (mrkdwnBody) {
    body = mrkdwnBody;
  } else {
    if (pullRequest.body_text) {
      // Remove line breaks and spaces that follow more than one
      body = pullRequest.body_text.replace(/\n/g, '').replace(/ {2,}/g, ' ');
    }
  }

  let image = ''
  if (mrkdwnImage) { // May be undefined, so make it an empty string
    image = mrkdwnImage;
  }

  return {
    body: body,
    image: image,
  }
}

async function getIssue(event, token) {

  let issue;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/issues/${event.issue.number}`,
      headers: {
        'Accept': 'application/vnd.github.3.full+json',
        'Authorization': `token ${token}`,
      },
    });
    issue = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  let bodyHtml = ''
  if (issue.body_html) { // May be null, so make it an empty string
    bodyHtml = issue.body_html;
  }

  const { text: mrkdwnBody, image: mrkdwnImage } = mrkdwn(bodyHtml); // Argument must be a string

  let body = '';
  if (mrkdwnBody) {
    body = mrkdwnBody;
  } else {
    if (issue.body_text) {
      // Remove line breaks and spaces that follow more than one
      body = issue.body_text.replace(/\n/g, '').replace(/ {2,}/g, ' ');
    }
  }

  let image = ''
  if (mrkdwnImage) { // May be undefined, so make it an empty string
    image = mrkdwnImage;
  }

  return {
    body: body,
    image: image
  }
}

async function getReview(event, token) {

  let review;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/pulls/${event.pull_request.number}/reviews/${event.review.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.full+json',
        'Authorization': `token ${token}`,
      },
    });
    review = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  let bodyHtml = ''
  if (review.body_html) { // May be null, so make it an empty string
    bodyHtml = review.body_html;
  }

  const { text: mrkdwnBody, image: mrkdwnImage } = mrkdwn(bodyHtml); // Argument must be a string

  let body = '';
  if (mrkdwnBody) {
    body = mrkdwnBody;
  } else {
    if (review.body_text) {
      // Remove line breaks and spaces that follow more than one
      body = review.body_text.replace(/\n/g, '').replace(/ {2,}/g, ' ');
    }
  }

  let image = ''
  if (mrkdwnImage) { // May be undefined, so make it an empty string
    image = mrkdwnImage;
  }

  return {
    body: body,
    image: image
  }
}

async function getComment(event, token) {

  let comment;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/issues/comments/${event.comment.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.full+json',
        'Authorization': `token ${token}`,
      },
    });
    comment = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  let bodyHtml = ''
  if (comment.body_html) { // May be null, so make it an empty string
    bodyHtml = comment.body_html;
  }

  const { text: mrkdwnBody, image: mrkdwnImage } = mrkdwn(bodyHtml); // Argument must be a string

  let body = '';
  if (mrkdwnBody) {
    body = mrkdwnBody;
  } else {
    if (comment.body_text) {
      // Remove line breaks and spaces that follow more than one
      body = comment.body_text.replace(/\n/g, '').replace(/ {2,}/g, ' ');
    }
  }

  let image = ''
  if (mrkdwnImage) { // May be undefined, so make it an empty string
    image = mrkdwnImage;
  }

  return {
    body: body,
    image: image
  }
}

async function getReviewComments(event, token) {

  let comments;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/pulls/${event.pull_request.number}/reviews/${event.review.id}/comments`,
      headers: {
        'Accept': 'application/vnd.github.3.full+json',
        'Authorization': `token ${token}`,
      },
    });
    comments = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  return comments.map(comment => {

    let bodyHtml = ''
    if (comment.body_html) { // May be null, so make it an empty string
      bodyHtml = comment.body_html;
    }

    const { text: mrkdwnBody, image: mrkdwnImage } = mrkdwn(bodyHtml); // Argument must be a string

    let body = '';
    if (mrkdwnBody) {
      body = mrkdwnBody;
    } else {
      if (comment.body_text) {
        // Remove line breaks and spaces that follow more than one
        body = comment.body_text.replace(/\n/g, '').replace(/ {2,}/g, ' ');
      }
    }

    let image = ''
    if (mrkdwnImage) { // May be undefined, so make it an empty string
      image = mrkdwnImage;
    }

    return {
      html_url: comment.html_url,
      body: body,
      image: image,
    }
  })
}

class GitHubError extends Error {
  constructor(message) {
    super(message);
    this.message = `GitHub API error (message: ${message}).`;
  }
}

async function post2Slack(message, token) {

  let description = message.description;
  description = description.replace(/<actor>/g, message.actor.name);
  description = description.replace(/<author>/g, message.author.name)

  let appEmoji = null; // Empty string is judged to have data
  if (message.appEmoji) {
    appEmoji = message.appEmoji;
  }

  let authorName = '', authorLink = '', authorIcon = '';
  if (message.actor.shouldShow) {
    if (message.actor.name == message.author.name) {
      authorName = `${message.actor.name} (author)`;
    } else {
      authorName = message.actor.name;
    }
    authorLink = message.actor.link;
    authorIcon = message.actor.icon;
  }

  let fields = [];
  if (message.pullDetail.shouldShow) {
    fields = createPullRequestFields(message.repoUrl, message.pullDetail);
  } else if (message.issueDetail.shouldShow) {
    fields = createIssueFields(message.repoUrl, message.issueDetail);
  }

  const res = await axios({
    method: 'post',
    url: `${SLACK_API_BASE_URL}/chat.postMessage`,
    data: {
      'channel': message.channel,
      'username': message.appName,
      'icon_url': message.appIcon,
      'icon_emoji': appEmoji,
      'text': description,
      'attachments': [
        {
          'mrkdwn_in': ['text'],
          'color': message.color,
          'author_name': authorName,
          'author_link': authorLink,
          'author_icon': authorIcon,
          'title': message.title,
          'title_link': message.titleLink,
          'text': message.body,
          'fields': fields,
          'image_url': message.image,
          'footer': message.footer,
          'footer_icon': message.footerIcon,
          'ts': Math.floor(new Date().getTime() / 1000),
        }
      ],
      'thread_ts': message.targetTimestamp,
    },
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.data.ok) {
    throw new Error(`Slack API error (message: ${res.data.error}).`);
  }

  return res.data.ts; // return timestamp
}

function createPullRequestFields(repoUrl, detail) {

  const fields = [
    {
      'title': 'Commits',
      'value': `<${repoUrl}/pull/${detail.number}/commits|${detail.commits}>`,
      'short': true
    },
    {
      'title': 'Changed files ( _lines_ )',
      'value': `<${repoUrl}/pull/${detail.number}/files|${detail.changedFiles}> ( _+${detail.additions}_ _\`-${detail.deletions}\`_ )`,
      'short': true
    },
  ];

  if (detail.labelNames.length != 0) {
    fields.push(
      {
        'title': 'Labels',
        'value': detail.labelNames.map(name => `<${repoUrl}/labels/${name}|\`${name}\`>`).join(' '),
        'short': true
      }
    )
  }

  if (detail.milestone.number) {
    fields.push(
      {
        'title': 'Milestone',
        'value': `<${repoUrl}/milestone/${detail.milestone.number}|${detail.milestone.name}>`,
        'short': true
      }
    )
  }

  return fields;
}

function createIssueFields(repoUrl, detail) {

  const fields = [];

  if (detail.labelNames.length != 0) {
    fields.push(
      {
        'title': 'Labels',
        'value': detail.labelNames.map(name => `<${repoUrl}/labels/${name}|\`${name}\`>`).join(' '),
        'short': true
      }
    )
  }

  if (detail.milestone.number) {
    fields.push(
      {
        'title': 'Milestone',
        'value': `<${repoUrl}/milestone/${detail.milestone.number}|${detail.milestone.name}>`,
        'short': true
      }
    )
  }

  return fields;
}

module.exports = {
  githubApi: {
    getPullRequest: getPullRequest,
    getIssue: getIssue,
    getReview: getReview,
    getComment: getComment,
    getReviewComments: getReviewComments,
  },
  slackApi: {
    post: post2Slack,
  },
};
