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
    case 'pull_request': {
      await handlePullRequest(input);
      break;
    }
    case 'issues': {
      await handleIssues(input);
      break;
    }
    case 'pull_request_review': {
      const timestamp = await handlePullRequestReview(input);
      await handlePullRequestReviewComment(input, timestamp);
      break;
    }
    case 'issue_comment': {
      await handleIssueComment(input);
      break;
    }
    default: {
    }
  }
}

async function handlePullRequest(input) {

  if (input.subscribePulls != 'true') return;

  const message = createBaseMessage(input);

  message.author.name = input.event.pull_request.user.login;
  if (input.showPullActor != 'false') {
    message.actor.shouldShow = true;
  }

  message.title = `#${input.event.pull_request.number} ${input.event.pull_request.title}`;
  message.titleLink = input.event.pull_request.html_url;

  if (input.showPullDetail != 'false') {
    message.pullRequestDetail.shouldShow = true;
  }

  switch (input.event.action) {
    case 'opened': {
      if (input.event.pull_request.draft) {
        message.description = input.pullDraftOpenMessage;
        message.color = COLOR.DRAFT_GRAY;
      } else {
        message.description = input.pullOpenMessage;
        message.color = COLOR.OPEN_GREEN;
        const { body, image } = await githubApi.getPullRequest(input.event, input.githubToken);
        message.body = body;
        message.image = image;
        message.pullRequestDetail.commits = input.event.pull_request.commits;
        message.pullRequestDetail.changedFiles = input.event.pull_request.changed_files;
        message.pullRequestDetail.additions = input.event.pull_request.additions;
        message.pullRequestDetail.deletions = input.event.pull_request.deletions;
        message.pullRequestDetail.url = input.event.pull_request.html_url;
      }
      break;
    }
    case 'reopened': {
      if (input.event.pull_request.draft) {
        message.description = input.pullDraftReopenMessage;
        message.color = COLOR.DRAFT_GRAY;
      } else {
        message.description = input.pullReopenMessage;
        message.color = COLOR.OPEN_GREEN;
        const { body, image } = await githubApi.getPullRequest(input.event, input.githubToken);
        message.body = body;
        message.image = image;
        message.pullRequestDetail.commits = input.event.pull_request.commits;
        message.pullRequestDetail.changedFiles = input.event.pull_request.changed_files;
        message.pullRequestDetail.additions = input.event.pull_request.additions;
        message.pullRequestDetail.deletions = input.event.pull_request.deletions;
        message.pullRequestDetail.url = input.event.pull_request.html_url;
      }
      break;
    }
    case 'ready_for_review': {
      message.description = input.pullReadyMessage;
      message.color = COLOR.OPEN_GREEN;
      const { body, image, } = await githubApi.getPullRequest(input.event, input.githubToken);
      message.body = body;
      message.image = image;
      message.pullRequestDetail.commits = input.event.pull_request.commits;
      message.pullRequestDetail.changedFiles = input.event.pull_request.changed_files;
      message.pullRequestDetail.additions = input.event.pull_request.additions;
      message.pullRequestDetail.deletions = input.event.pull_request.deletions;
      message.pullRequestDetail.url = input.event.pull_request.html_url;
      break;
    }
    case 'closed': {
      if (input.event.pull_request.merged) {
        message.description = input.pullMergeMessage;
        message.color = COLOR.MERGED_PURPLE;
      } else {
        message.description = input.pullCloseMessage;
        message.color = COLOR.CLOSED_RED;
      }
      break;
    }
    default: {
      return;
    }
  }

  await slackApi.post(message, input.slackToken);
}

async function handleIssues(input) {

  if (input.subscribeIssues != 'true') return;

  const message = createBaseMessage(input);

  message.author.name = input.event.issue.user.login;
  if (input.showIssueActor != 'false') {
    message.actor.shouldShow = true;
  }

  message.title = `#${input.event.issue.number} ${input.event.issue.title}`;
  message.titleLink = input.event.issue.html_url;

  switch (input.event.action) {
    case 'opened': {
      message.description = input.issueOpenMessage;
      message.color = COLOR.OPEN_GREEN;
      const { body, image } = await githubApi.getIssue(input.event, input.githubToken);
      message.body = body;
      message.image = image;
      break;
    }
    case 'reopened': {
      message.description = input.issueReopenMessage;
      message.color = COLOR.OPEN_GREEN;
      const { body, image } = await githubApi.getIssue(input.event, input.githubToken);
      message.body = body;
      message.image = image;
      break;
    }
    case 'closed': {
      message.description = input.issueCloseMessage;
      message.color = COLOR.CLOSED_RED;
      break;
    }
    default: {
      return;
    }
  }

  await slackApi.post(message, input.slackToken);
}

async function handlePullRequestReview(input) {

  if (input.subscribeReviews != 'true') return;

  const message = createBaseMessage(input);

  message.author.name = input.event.pull_request.user.login;
  if (input.showReviewActor != 'false') {
    message.actor.shouldShow = true;
  }

  message.title = `Review on #${input.event.pull_request.number} ${input.event.pull_request.title}`;
  message.titleLink = input.event.review.html_url;
  const { body, image } = await githubApi.getReview(input.event, input.githubToken);
  message.body = body;
  message.image = image;

  switch (input.event.action) {
    case 'submitted': {
      switch (input.event.review.state) {
        case 'approved': {
          message.description = input.reviewApproveMessage;
          message.color = COLOR.OPEN_GREEN;
          break;
        }
        case 'changes_requested': {
          message.description = input.reviewRequestChangesMessage;
          message.color = COLOR.CLOSED_RED;
          break;
        }
        case 'commented': {
          // Do not post if there is no message
          if (!message.body) return;
          message.description = input.reviewCommentMessage;
          break;
        }
        default: {
          return;
        }
      }
      break;
    }
    default: {
      return;
    }
  }

  return await slackApi.post(message, input.slackToken); // return timestamp
}

/*
  Don't use 'pull_request_review_comment' events, uselessly launch GitHub Actions work flows.
*/
async function handlePullRequestReviewComment(input, targetTimestamp) {

  if (input.subscribePullComments != 'true') return;

  if (input.event.action != 'submitted') return;

  const comments = await githubApi.getReviewComments(input.event, input.githubToken);

  for (const comment of comments) {
    const message = createBaseMessage(input);
    message.author.name = input.event.pull_request.user.login;
    if (input.showPullCommentActor != 'false') {
      message.actor.shouldShow = true;
    }
    message.description = input.pullCommentMessage;
    message.title = `Comment on #${input.event.pull_request.number} ${input.event.pull_request.title}`;
    message.titleLink = comment.html_url;
    message.body = comment.body;
    message.image = comment.image;
    if (targetTimestamp && input.threadingComments == 'true') {
      message.targetTimestamp = targetTimestamp;
    }
    const timestamp = await slackApi.post(message, input.slackToken);
    if (!targetTimestamp) {
      targetTimestamp = timestamp;
    }
  }
}

async function handleIssueComment(input) {

  if (input.event.issue.pull_request && input.subscribePullComments != 'true') return;
  if (!input.event.issue.pull_request && input.subscribeIssueComments != 'true') return;

  const message = createBaseMessage(input);

  message.author.name = input.event.issue.user.login;
  if (input.event.issue.pull_request && input.showPullCommentActor != 'false') {
    message.actor.shouldShow = true;
  }
  if (!input.event.issue.pull_request && input.showIssueCommentActor != 'false') {
    message.actor.shouldShow = true;
  }

  switch (input.event.action) {
    case 'created': {
      if (input.event.issue.pull_request) {
        message.description = input.pullCommentMessage;
      } else {
        message.description = input.issueCommentMessage;
      }
      message.title = `Comment on #${input.event.issue.number} ${input.event.issue.title}`;
      message.titleLink = input.event.comment.html_url;
      const { body, image } = await githubApi.getComment(input.event, input.githubToken);
      message.body = body;
      message.image = image;
      break;
    }
    default: {
      return;
    }
  }

  await slackApi.post(message, input.slackToken);
}

function createBaseMessage(input) {
  return {
    channel: input.channel,
    appName: input.appName,
    appIcon: input.appIcon,
    footer: input.footer,
    footerIcon: input.footerIcon,
    author: {
      name: '',
    },
    actor: {
      shouldShow: false,
      name: input.event.sender.login,
      link: input.event.sender.html_url,
      icon: input.event.sender.avatar_url,
    },
    description: '',
    color: COLOR.BASE_BLACK,
    title: '',
    titleLink: '',
    body: '',
    image: '',
    pullRequestDetail: {
      shouldShow: false,
      commits: 0,
      changedFiles: 0,
      additions: 0,
      deletions: 0,
      url: '',
    },
    targetTimestamp: '',
  }
}

module.exports = run;
