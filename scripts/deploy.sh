#!/bin/sh

TARGET_BRANCH=master
DIR_NAME=master-branch

# abort the script if there is a non-zero error
set -e

# show where we are on the machine
pwd
remote=$(git config remote.origin.url)

# make directory to put deploy branch in

echo ">> Creating master-branch folder..."
mkdir $DIR_NAME
cd $DIR_NAME

# setup a new repo so we can update the deploy branch
git config --global user.name "$GITHUB_USER_NAME" > /dev/null 2>&1
git config --global user.email "$GITHUB_USER_EMAIL" > /dev/null 2>&1
git init

mkdir ~/.ssh/ && echo -e "Host github.com\n\t\StringHostKeyChecking no\n" > ~/.ssh/config

git remote add --fetch origin "$remote"

echo ">> Switching into $TARGET_BRANCH branch ..."

if git rev-parse --verify origin/$TARGET_BRANCH > /dev/null/ 2>&1
then
	git checkout $TARGET_BRANCH
	# delete any old site data as we are going to replace it
	# Note: this explodes if there aren't any, so moving it here for now
	git rm rf .
else
	git checkout --orphan $TARGET_BRANCH
fi

cd .. && cd ..

echo ">> Copying over new site ..."
cp -a public/. scripts/$DIR_NAME .

#Copying over circleci config to deploy branch ensures that once deployed to deploy, the build will not start again on circleci

echo ">> Copying over CircleCi config file ..."
mkdir -p scripts/$DIR_NAME/.circleci && cp -a .circleci/ scripts/$DIR_NAME/.circleci/
cd scripts/$DIR_NAME

# stage any new changes and new files
git add -A
git commit --allow-empty -m "Deploy to Github Pages [commit: $CIRCLECI_SHA1] [build: $CIRCLECI_BUILD_NUM] [ci-skip]"

# push, but sending any output to /dev/null to hide sensitive information
git push --force --quiet origin $TARGET_BRANCH > /dev/null 2>&1

# go back to where we started
cd ..
rm -rf $DIR_NAME

echo ">>> Finished Deployment :D <<<"
