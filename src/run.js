const { githubApi, slackApi } = require('./utils');
const COLOR = require('./color');

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

  const message = createBaseMessage();

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
      const { body, image } = await githubApi.getPullRequest(input);
      message.body = body;
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

  await slackApi.post(input, message);
}

async function handleIssues(input) {

  if (input.issues != 'true') return;

  const message = createBaseMessage();

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

  await slackApi.post(input, message);
}

async function handlePullRequestReview(input) {

  if (input.reviews != 'true') return;

  const message = createBaseMessage();

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

  await slackApi.post(input, message);
}

/*
  Don't use 'pull_request_review_comment' events, uselessly launch GitHub Actions work flows.
*/
async function handlePullRequestReviewComment(input) {

  if (input.comments != 'true') return;

  if (input.event.action != 'submitted') return;

  const comments = await githubApi.getReviewComments(input);

  for (const comment of comments) {
    const message = createBaseMessage();
    message.title = `Comment on #${input.event.pull_request.number} ${input.event.pull_request.title}`;
    message.titleLink = comment.html_url;
    message.body = comment.body;
    message.image = comment.image;
    await slackApi.post(input, message);
  }
}

async function handleIssueComment(input) {

  if (input.comments != 'true') return;

  const message = createBaseMessage();

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

  await slackApi.post(input, message);
}

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

module.exports = run;
