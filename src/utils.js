const axios = require('axios');
const mrkdwn = require('html-to-mrkdwn');

const GITHUB_API_BASE_URL = 'https://api.github.com';

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

module.exports = {
  githubApi: {
    getPullRequestBody: getPullRequestBody,
  },
};
