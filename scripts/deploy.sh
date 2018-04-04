#!/bin/bash

set -euv

git config --global user.name "FSD Continuous Deployment"
git config --global user.email "fsd@users.noreply.github.com"
git remote rm origin
git remote add origin  https://br3nda:${GITHUB_TOKEN}@github.com/ServiceInnovationLab/HelpMePlan.git

git fetch origin
exec npm run deploy
