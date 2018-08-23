#!/usr/bin/env bash

# set -e # exit when error

ROOT_DIR=$(pwd)

if ! npm owner ls | grep -q "$(npm whoami)"
then
  printf "Release: Not an owner of the npm repo, ask for it.\n"
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

NEW_VERSION=$(node -p -e "require('$ROOT_DIR/package.json').version")
CHECK_NEW_TAG_REMOTE=$(git tag | grep "v$NEW_VERSION")

if [ "$CHECK_NEW_TAG_REMOTE" != "" ]; then
    printf "The tag $NEW_VERSION is already released.\n"
    exit 1
fi

REMOTE_TAGS=$(git tag --list 'v*[0-9.]')
LATEST_TAG=$(printf "%s\n" "v$NEW_VERSION" "${REMOTE_TAGS}" | sort --version-sort | tail -1)

if [ "$LATEST_TAG" != "v$NEW_VERSION" ]; then
    printf "You are trying to release an older version $NEW_VERSION than the one on remote $LATEST_TAG.\n"
    exit 1
fi

# Update README ToC
doctoc README.md

# Update and tag Git project
git commit -am "${NEW_VERSION}"
git tag -a v${NEW_VERSION}
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