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
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${token}`,
      },
    });
    pullRequest = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(pullRequest.body_html);

  return {
    body: text,
    image: image,
  }
}

async function getIssue(event, token) {

  let issue;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/issues/${event.issue.number}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${token}`,
      },
    });
    issue = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(issue.body_html);

  return {
    body: text,
    image: image
  }
}

async function getReview(event, token) {

  let review;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/pulls/${event.pull_request.number}/reviews/${event.review.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${token}`,
      },
    });
    review = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(review.body_html);

  return {
    body: text,
    image: image
  }
}

async function getComment(event, token) {

  let comment;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/issues/comments/${event.comment.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${token}`,
      },
    });
    comment = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(comment.body_html);

  return {
    body: text,
    image: image
  }
}

async function getReviewComments(event, token) {

  let comments;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${event.repository.full_name}/pulls/${event.pull_request.number}/reviews/${event.review.id}/comments`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${token}`,
      },
    });
    comments = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  return comments.map(comment => {
    const { text, image } = mrkdwn(comment.body_html);
    return {
      html_url: comment.html_url,
      body: text,
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

async function post2Slack(message) {

  message.description = message.description.replace(/<actor>/g, message.actor.name);
  message.description = message.description.replace(/<author>/g, message.author.name)

  let fields = null;
  if (message.pullRequestDetail.shouldShow) {
    fields = createFields(message.pullRequestDetail);
  }

  const res = await axios({
    method: 'post',
    url: `${SLACK_API_BASE_URL}/chat.postMessage`,
    data: {
      'channel': message.channel,
      'username': message.appName,
      'icon_url': message.appIcon,
      'text': message.description,
      'attachments': [
        {
          'mrkdwn_in': ['text'],
          'color': message.color,
          'author_name': message.actor.name,
          'author_link': message.actor.link,
          'author_icon': message.actor.icon,
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
      'Authorization': `Bearer ${message.slackToken}`,
    },
  });

  if (!res.data.ok) {
    throw new Error(`Slack API error (message: ${res.data.error}).`);
  }

  return res.data.ts; // return timestamp
}

function createFields(pullRequestDetail) {
  return [
    {
      'title': ':round_pushpin: Commits',
      'value': `<${pullRequestDetail.url}/commits|${pullRequestDetail.commits}>`,
      'short': true
    },
    {
      'title': ':page_facing_up: Changed files ( _lines_ )',
      'value': `<${pullRequestDetail.url}/files|${pullRequestDetail.changedFiles}> ( _+${pullRequestDetail.additions}_ _\`-${pullRequestDetail.deletions}\`_ )`,
      'short': true
    },
  ];
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
