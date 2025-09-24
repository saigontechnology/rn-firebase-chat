# Release Guide

This document explains how to release new versions of `rn-firebase-chat` to npm.

## Prerequisites

1. **NPM Account**: You need to be logged into npm with publish permissions
   ```bash
   npm whoami  # Check if logged in
   npm login   # Login if needed
   ```

2. **Repository Access**: You need write access to the GitHub repository

3. **Clean Working Directory**: Ensure no uncommitted changes
   ```bash
   git status  # Should show "working tree clean"
   ```

## Release Process

### Automated Release (Recommended)

The package uses `release-it` for automated releases with conventional changelog generation.

#### For Patch Releases (Bug Fixes)
```bash
yarn release
```

#### For Minor Releases (New Features)
```bash
yarn release minor
```

#### For Major Releases (Breaking Changes)
```bash
yarn release major
```

#### Dry Run (Test Without Publishing)
```bash
yarn release:dry
```

### Manual Release Steps

If you prefer manual control:

1. **Update Version**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Build the Package**
   ```bash
   yarn prepack
   ```

3. **Run Tests**
   ```bash
   yarn test
   yarn lint
   yarn typecheck
   ```

4. **Publish to npm**
   ```bash
   npm publish
   ```

5. **Push Changes**
   ```bash
   git push origin master --tags
   ```

## GitHub Actions (CI/CD)

The repository includes automated workflows:

- **CI Workflow** (`ci.yml`): Runs on every push/PR to master branch
  - Linting
  - Type checking  
  - Unit tests
  - Build verification

- **Release Workflow** (`release.yml`): Automated releases on master branch
  - Runs full CI checks
  - Publishes to npm
  - Creates GitHub releases
  - Updates changelog

### Setting up Automated Releases

To enable automated releases via GitHub Actions, add these secrets to your repository:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `NPM_TOKEN`: Your npm automation token
   - `GITHUB_TOKEN`: Automatically provided by GitHub

#### Creating NPM Token

1. Go to [npm.com](https://www.npmjs.com) → Profile → Access Tokens
2. Generate New Token → Automation
3. Copy the token and add it to GitHub secrets

## Pre-Release Checklist

- [ ] All tests pass (`yarn test`)
- [ ] No linting errors (`yarn lint`)
- [ ] No TypeScript errors (`yarn typecheck`)
- [ ] Build succeeds (`yarn prepack`)
- [ ] Update README if needed
- [ ] Update CHANGELOG if using manual process
- [ ] Working tree is clean (`git status`)

## Post-Release Checklist

- [ ] Verify package published to npm: https://www.npmjs.com/package/rn-firebase-chat
- [ ] Check GitHub release created: https://github.com/saigontechnology/rn-firebase-chat/releases
- [ ] Test installation in a fresh project
- [ ] Update example app if needed

## Troubleshooting

### NPM Publish Fails
- Check if you're logged in: `npm whoami`
- Verify package name isn't taken
- Check npm registry: `npm config get registry`

### Version Already Exists
- Check latest version: `npm view rn-firebase-chat version`
- Use correct version bump: patch/minor/major

### Git Push Fails
- Ensure you have push permissions
- Check if branch is protected
- Verify remote URL: `git remote -v`

## Semantic Versioning

This package follows [Semantic Versioning (SemVer)](https://semver.org/):

- **PATCH** (x.x.X): Bug fixes, documentation updates
- **MINOR** (x.X.x): New features, backward compatible
- **MAJOR** (X.x.x): Breaking changes, API changes

## Conventional Commits

Use conventional commit messages for automatic changelog generation:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump) 
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks
- `BREAKING CHANGE:` - Breaking changes (major version bump)