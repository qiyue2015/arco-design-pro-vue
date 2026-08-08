# Generated Edition Releases

`release-version.json` is the only version source for the customized full and simple editions. A push to the template repository's `main` branch checks for `v<version>` in both release repositories. When both tags exist, the workflow exits successfully without generating or committing anything.

For a new version, the workflow generates both editions under the runner's temporary directory, stamps their `package.json` files, installs dependencies, type-checks, and builds both. No target repository is changed unless every validation passes. It then synchronizes and pushes normal commits to:

- `qiyue2015/arco-design-pro-vite`
- `qiyue2015/arco-design-pro-vite-simple`

The sync is deliberately scoped. A generated-file manifest controls later deletions; the first migration only cleans the reviewed `src/`, `config/`, and `plop-templates/` roots. Full-edition `README.md` and `LICENSE` are preserved. Simple-edition staging configuration and `qupload.conf` are preserved. `.git`, `node_modules`, `dist`, caches, and release temporary files are never copied.

Each changed repository receives the title `chore(release): sync v<version>`. Its body records the source repository, full source SHA, previous release, and non-merge commit subjects since the previous `.release-source.json` SHA. Both editions receive identical source metadata and commit text. The first release uses `initial release`; an empty source range with changed generated output uses `Generated output changed`. No generated difference means no commit or tag.

## Required Credential

Create an Actions secret named `RELEASE_REPOSITORIES_TOKEN` in `qiyue2015/arco-design-pro-vue`. Use a fine-grained personal access token restricted to the two release repositories with only:

- Repository access: `arco-design-pro-vite` and `arco-design-pro-vite-simple`
- Repository permission: Contents, read and write

Metadata read access is implicit. No Actions, Administration, Issues, Pull requests, or force-push permission is required. The source repository's `GITHUB_TOKEN` remains read-only. Branch protection must allow ordinary bot pushes or the workflow will fail safely.

To publish, update `version` in `release-version.json` and push that reviewed change with the template changes to `main`. Do not manually dispatch the workflow, create a GitHub Release, or use a manually created tag as the trigger.
