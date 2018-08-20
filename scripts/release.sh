#!/usr/bin/env bash

set -e # exit when error

if ! npm owner ls | grep -q "$(npm whoami)"
then
  printf "Release: Not an owner of the npm repo, ask for it\n"
  exit 1
fi

currentBranch=`git rev-parse --abbrev-ref HEAD`
if [ $currentBranch != 'master' ]; then
  printf "Release: You must be on master\n"
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  printf "Release: Working tree is not clean (git status)\n"
  exit 1
fi

if [[ $# -eq 0 ]] ; then
  printf "Release: use ``npm run release [major|minor|patch|x.x.x]``\n"
  exit 1
fi


# Bump project version
mversion $1


# Get new version from package.json
NEW_VERSION=$(node -p -e "require('./package.json').version")


# Update README ToC
doctoc README.md


# Update and tag Git project
git commit -am "${NEW_VERSION}"
git tag v${NEW_VERSION}
git push
git push --tags
npm publish


# Docker
printf "Release: build Docker image, tag it (latest and ${NEW_VERSION}) and push it to Docker hub\n"

cd docker

# Build image
docker build -t vvoyer/selenium-standalone . --rm

# Login to default Docker hub (https://hub.docker.com/)
docker login

# Tag image and push it to Docker hub
for tag in ${NEW_VERSION} latest
do
    docker tag vvoyer/selenium-standalone vvoyer/selenium-standalone:${tag}
    docker push vvoyer/selenium-standalone:${tag}
done

cd ..


# Reminder to manually update project history file
printf "Release: please update the HISTORY manually\n"
