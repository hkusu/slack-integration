const axios = require('axios');
const mrkdwn = require('html-to-mrkdwn');

const GITHUB_API_BASE_URL = 'https://api.github.com';
const SLACK_API_BASE_URL = 'https://slack.com/api';

async function getPullRequest(input) {

  let pullRequest;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/pulls/${input.event.pull_request.number}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${input.githubToken}`,
      },
    });
    pullRequest = res.data
  } catch (e) {
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(pullRequest.body_html);

  return {
    body: text,
    image: image
  }
}

async function getIssue(input) {

  let issue;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/issues/${input.event.issue.number}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${input.githubToken}`,
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

async function getReview(input) {

  let review;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/pulls/${input.event.pull_request.number}/reviews/${input.event.review.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${input.githubToken}`,
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

async function getComment(input) {

  let comment;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/issues/comments/${input.event.comment.id}`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${input.githubToken}`,
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

async function getReviewComments(input) {

  let comments;

  try {
    const res = await axios({
      url: `${GITHUB_API_BASE_URL}/repos/${input.event.repository.full_name}/pulls/${input.event.pull_request.number}/reviews/${input.event.review.id}/comments`,
      headers: {
        'Accept': 'application/vnd.github.3.html+json',
        'Authorization': `token ${input.githubToken}`,
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

async function post2Slack(input, message, previousPostTimestamp) {

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

  let threadTimestamp = null;
  if (input.threadComments == 'true' && previousPostTimestamp) {
    threadTimestamp = previousPostTimestamp
  }

  const res = await axios({
    method: 'post',
    url: `${SLACK_API_BASE_URL}/chat.postMessage`,
    data: {
      'channel': input.channel,
      'username': input.appName,
      'icon_url': input.appIcon,
      'text': message.description,
      'attachments': [
        {
          'mrkdwn_in': ['text'],
          'color': message.color,
          'author_name': input.event.sender.login,
          'author_link': input.event.sender.html_url,
          'author_icon': input.event.sender.avatar_url,
          'title': message.title,
          'title_link': message.titleLink,
          'text': message.body,
          'image_url': message.image,
          'footer': input.footer,
          'footer_icon': input.footerIcon,
          'ts': Math.floor(new Date().getTime() / 1000),
        }
      ],
      'thread_ts': threadTimestamp,
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

  return res.data.ts; // return timestamp
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
