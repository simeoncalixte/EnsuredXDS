# Private npm package

This repository publishes `@simeoncalixte/ensured-xds` to GitHub Packages.
The package source directory is `.`. Application consumers may keep
`@ensured/xds` imports by installing it as an npm alias.

## Release

From the package directory, with Node 22 or newer:

```sh
npm ci
npm version patch
```

Commit any dependency lockfile updates. Push the release commit and matching
`vX.Y.Z` tag. `.github/workflows/packages.yml` checks the tag against the manifest,
builds the package, packs only its declared files, and publishes using the
repository's built-in `GITHUB_TOKEN`. Package versions are immutable; bump the
version for every new release. Do not move an existing release tag.

For `EnsuredNetwork`, run versioning in `frontend/` and create the tag at the
repository root if npm did not create one for the nested package.

## Private package access

Set `NODE_AUTH_TOKEN` to a GitHub token (classic) with `read:packages` for local
installation. GitHub Actions uses `secrets.GITHUB_TOKEN` instead. Grant consumer
repositories **Read** access in the package's **Manage Actions access** settings.
Keep package visibility private.

XDS must grant access to EnsuredAuthUI, EnsuredMarketplace, EnsuredNetwork, and
EnsuredUI. Each of the other four packages must grant access to EnsuredUI.
Publish XDS first; then constants, Auth UI, Marketplace, and Network UI; finally
update the frontend's pinned dependency versions and lockfile.

No npm token, application `.env`, or sibling checkout is included in the package.
