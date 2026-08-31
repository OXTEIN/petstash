name: Update pet database

on:
  schedule:
    - cron: '0 6 * * 1'      # every Monday 06:00 UTC
  workflow_dispatch: {}       # run on demand from the Actions tab

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - name: Refresh pet data
        run: node scripts/update.mjs
      - name: Commit if changed
        run: |
          git config user.name "stashio-bot"
          git config user.email "actions@users.noreply.github.com"
          git add pets.json index.html
          if git diff --staged --quiet; then
            echo "No changes — already up to date."
          else
            git commit -m "Auto-update pet database"
            git push
          fi
