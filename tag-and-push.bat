@echo off
set /p VERSION=Enter version tag (e.g. v0.0.2): 

echo Staging all changes...
git add .

echo Committing with message "Release: %VERSION%"...
git commit -m "Release: %VERSION%"

echo Creating tag %VERSION%...
git tag %VERSION%

echo Pushing commit and tag...
git push
git push origin %VERSION%

echo ✅ Tagged and pushed version %VERSION%
pause
