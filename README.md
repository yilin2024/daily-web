# Fieldwork

Open [index.html](./index.html) in a modern browser to use the dashboard. It also works on GitHub Pages without a build step.

- Use **New task** to capture work. A task can have a project, priority, status, and due date.
- Open a project to see its tasks. Checking off a task updates both project and overall progress. Each task counts equally.
- Open **Workspace data → Remove samples** when you’re ready to start your own workspace. This keeps your edits and additions.
- **Export backup** downloads your workspace as JSON. Use **Restore backup** to load it in another browser or at your published address. Clearing browser storage removes the local copy.

## GitHub Pages

The site address is <https://yilin2024.github.io/daily-web/>. The public site serves the app and its sample data. Work you enter stays in that browser. Keep exported backups outside the published repository.

The site files are in the repository root. To publish an update, merge the tested changes from `main` into `gh-pages`. In **Settings → Pages**, the branch publishing source is `gh-pages` and the folder is `/(root)`.

[GitHub Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
