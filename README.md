# Slack Integration (Beta)

<img src="./doc/image1.png" width="400">

## Usage

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
      - uses: hkusu/slack-integration@beta
        with:
          slack-token: ${{ secrets.SLACK_TOKEN }}
          channel: 'my-report-channel'
          pulls: true
          issues: true
          reviews: true
          pull-comments: true
          issue-comments: true
```

*NOTE:*

This YAML file must be in the head branch of the pull request to handle `pull_request` and `pull_request_review` events.
Also, to handle `issue` and `issue_comment` events that need to be in the default branch.
`issue_comment` event is required not only for issues but also for pull request comments.
