const axios = require('axios');
const mrkdwn = require('html-to-mrkdwn');

const GITHUB_API_BASE_URL = 'https://api.github.com';
const SLACK_API_BASE_URL = 'https://slack.com/api';

async function getPullRequestBody(input) {

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
    throw new GitHubError(e.message);
  }

  const { text, image } = mrkdwn(pullRequest.body_html);

  return {
    body: text,
    image: image
  }
}

class GitHubError extends Error {
  constructor(message) {
    super(message);
    this.message = `GitHub API error (message: ${message}).`;
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

const COLOR = {
  BASE_BLACK: '#24292f',
  OPEN_GREEN: '#36a64f',
  MERGED_PURPLE: '#6f42c1',
  CLOSED_RED: '#cb2431',
  DRAFT_GRAY: '#6a737d',
};

function createBaseMessage() {
  return {
    description: '',
    color: COLOR.BASE_BLACK,
    title: '',
    titleLink: '',
    body: '',
    image: '',
  }
}

module.exports = {
  githubApi: {
    getPullRequestBody: getPullRequestBody,
  },
  slackApi: {
    post: post2Slack,
  },
  COLOR: COLOR,
  createBaseMessage: createBaseMessage,
};
