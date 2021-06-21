# Slack Integration for GitHub

This Action sends pull request and issue event messages to your Slack channel.
This is useful in environments where [official integration](https://github.com/integrations/slack) is not available, such as Slack Enterprise Grid.

<img src="./doc/image1.png" width="550">

## Usage

### Basic usage

```yaml
name: Slack Integration

on:
  pull_request:
    types: [opened, reopened, ready_for_review, closed]
  issues:
    types: [opened, reopened, closed]
  pull_request_review:
    types: [submitted]
  issue_comment:
    types: [created]

jobs:
  slack-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: hkusu/slack-integration@v1
        with:
          slack-token: ${{ secrets.SLACK_TOKEN }}
          channel: 'my-report-channel'
          subscribe-pulls: true
          subscribe-issues: true
          subscribe-reviews: true
          subscribe-pull-comments: true
          subscribe-issue-comments: true
```

**Note**:
This YAML file must be in the head branch of the pull request to handle `pull_request` and `pull_request_review` events.
Also, to handle `issue` and `issue_comment` events that need to be in the default branch.
`issue_comment` event is required not only for issues but also for pull request comments.

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `slack-token` | (Required) Your Slack App token. | |
| `channel` | (Required) Slack channel to send a message. | |
| `subscribe-pulls` | Subscribe to pull request open, reopen, ready, and close events. | `false` |
| `subscribe-issues` | Subscribe to issue open, reopen, and close events. | `false` |
| `subscribe-reviews` | Subscribe to pull request review submit events. | `false` |
| `subscribe-pull-comments` | Subscribe to comment events on pull requests. | `false` |
| `subscribe-issue-comments` | Subscribe to comment events on issues. | `false` |

### Customize messages

<img src="./doc/image2.png" width="500">

To change the message with the default, set the following inputs.

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `pull-open-message` | Pull request opened. | `Pull request opened by <actor> :sparkles:` |
| `pull-reopen-message` | Pull request reopened. | `Pull request reopened by <actor> :recycle:` |
| `pull-draft-open-message` | Draft pull request opened. | `Draft pull request opened by <actor> :memo:` |
| `pull-draft-reopen-message` | Draft pull request reopened. | `Draft pull request reopened by <actor> :memo:` |
| `pull-ready-message` | Pull request ready for review. | `Pull request ready for review by <actor> :sparkles:` |
| `pull-close-message` | Pull request closed. | `Pull request closed by <actor> :heavy_multiplication_x:` |
| `pull-merge-message` | Pull request merged. | `Pull request merged by <actor> :twisted_rightwards_arrows:` |
| `pull-comment-message` | Commented on pull request. |  |
| `issue-open-message` | Issue opened. | `Issue opened by <actor> :sparkles:` |
| `issue-reopen-message` | Issue reopened. | `Issue reopened by <actor> :recycle:` |
| `issue-close-message` | Issue closed. | `Issue closed by <actor> :heavy_multiplication_x:` |
| `issue-comment-message` | Commented on issue. |  |
| `review-approve-message` | Approved in review. | `<actor> approved <author>''s pull request :white_check_mark:` |
| `review-request-changes-message` | Requested change in review. | `<actor> requested changes on <author>''s pull request :no_entry:` |
| `review-comment-message` | Commented in the review. | `<actor> commented on <author>''s pull request :speech_balloon:` |

**Note**:
In the message you set, `<actor>` is replaced with the user name that took the action.
Similarly, `<author>` is replaced by the creator of the pull request or issue.

**Tips**:
Custom emojis in your slack workspace are effective.

### App and footer information

<img src="./doc/image3.png" width="500">

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `app-name` |  |  |
| `app-icon` | Icon url. |  |
| `app-emoji` | Emoji, eg `:ghost`. This is prioritized even if `app-icon` is set. |  |
| `footer` |  | `<${{ github.event.repository.html_url }}\|${{ github.event.repository.full_name }}>` |
| `footer-icon` | Icon url. | `${{ github.event.repository.owner.avatar_url }}` |


### Actor icon and name

<img src="./doc/image4.png" width="500">

Set whether to show the actor (user who took action) icon and name.

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `show-pull-actor` | Show actor of pull request events. | `true` |
| `show-issue-actor` | Show actor of issue events. | `true` |
| `show-review-actor` | Show actor of pull request review events. | `true` |
| `show-pull-comment-actor` | Show actor of comment events on pull request. | `true` |
| `show-issue-comment-actor` | Show actor of comment events on issue. | `true` |

### Threading comments

<img src="./doc/image5.png" width="500">

Thread comments posted at the same time, such as comments to pull request code.

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `threading-comments` | Thread comments posted at the same time. | `false` |

### Pull request / Issue details

<img src="./doc/image6.png" width="500">

**Action inputs**:

| Name | Description | Default |
| --- | --- | --- |
| `show-pull-detail` | Show details of pull request (number of commits, number of changed files, labels, milestone). | `true` |
| `show-issue-detail` | Show details of issue (labels, milestone). | `true` |

## Limitations

Due to GitHub restrictions, you cannot subscribe to events such as pull request creation and comments using `GITHUB_TOKEN`.
Use a personal access token to avoid this.

## License

[MIT](LICENSE)
