# Contributing to Percona Operator for MongoDB documentation

This repository contains the source files for Percona Operator for MongoDB documentation and this document explains how you can contribute to it.

If you'd like to submit a code patch, follow the [Contributing guide in the Operator code repository](https://github.com/percona/percona-server-mongodb-operator/blob/main/CONTRIBUTING.md).

By contributing, you agree to the [Percona Community code of conduct](https://github.com/percona/community/blob/main/content/contribute/coc.md).

The documentation is licensed under the [Attribution 4.0 International license (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

## How to contribute

You can contribute to documentation in the following ways:

**1. Request a doc change through a Jira issue**

If you've spotted a doc issue (a typo, broken links, inaccurate instructions, etc.) but don't have time nor desire to fix it yourself - let us know about it.

1. Open the [Jira issue tracker](https://jira.percona.com/projects/K8SPSMDB/issues) in your browser.
2. Sign in (create a Jira account if you don’t have one).
3. (Optional but recommended) Search if the issue you want to report is already reported.
4. Click the [Create issue](https://perconadev.atlassian.net/secure/CreateIssue.jspa) shortcut to create an issue
5. Select the Percona Operator for MongoDB in the Project dropdown and the issue type in the Issue Type dropdown. Click Next.
6. Describe the issue you have detected in the Summary, Description, Steps To Reproduce, Affects Version fields. 
7. Click Create.

**2. Leave your feedback**

We'd like to hear from you. Click **Rate this page** and leave your feedback. We will appreciate your leaving your email so that we can reach out to you with clarifications or updates, if needed.

3. **[Contribute to documentation yourself](#contribute-to-documentation-yourself)**

## Contribute to documentation yourself

Percona Operator for MongoDB documentation is written in [Markdown](https://www.markdownguide.org/basic-syntax/) language, so you can
[edit it online via GitHub](#edit-documentation-online-vi-github). If you wish to have more control over the doc process, jump to how to [edit documentation locally](#edit-documentation-locally).

To contribute to the documentation, you should be familiar with the following technologies:

- [MkDocs](https://www.mkdocs.org/getting-started/) documentation generator. We use it to convert source ``.md`` files to .html and PDF documents.
- [git](https://git-scm.com/) and [GitHub](https://guides.github.com/activities/hello-world/)
- [Docker](https://docs.docker.com/get-docker/). It allows you to run MkDocs in a virtual environment instead of installing it and its dependencies on your machine.

The source `.md` files are in the `docs/` directory.

### Edit documentation online via GitHub

1. Click the **Edit this page** link on the sidebar. The source ``.md`` file of the page opens in GitHub editor in your browser. If you haven't worked with the repository before, GitHub creates a [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) of it for you.

2. Edit the page. You can check your changes on the **Preview** tab.

3. Commit your changes.

  - In the *Commit changes* section, describe your changes.
  - Select the **Create a new branch for this commit and start a pull request** option
  - Click **Propose changes**.

4. GitHub creates a branch and a commit for your changes. It loads a new page on which you can open a pull request to Percona. The page shows the base branch - the one you offer your changes for, your commit message and a diff - a visual representation of your changes against the original page.  This allows you to make a last-minute review. When you are ready, click the **Create pull request** button.
5. Someone from our team reviews the pull request and if everything is correct, merges it into the documentation. Then it gets published on the site.

### Edit documentation locally

This option is for users who prefer to work from their computer and / or have the full control over the documentation process.

The steps are the following:

1. [Fork this repository](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork)
2. Clone the fork on your machine,
3. Go to `k8spsmdb-docs` and add the remote upstream repository:

    ```sh
    git remote add upstream git@github.com:percona/k8spsmdb-docs.git
    ```

4. Pull the latest changes from upstream

    ```sh
    git fetch upstream
    git merge upstream/main
    ```

   Always pull the latest changes before you start editing the documentation.

5. Create a branch for the changes you are planning to make. If there is a Jira ticket related to your contribution, name your branch in the following way: `<Jira issue number>-<short description>`, where the issue number is something like `K8SPSMDB-372`.

   Create the branch in your local repo as follows:

   ```
   git checkout -b K8SPSMDB-372-fix-feature-X
   ```

6. When your changes are ready, make a commit, mentioning the Jira issue in the commit message, if any:

   ```
   git add .
   git commit -m "K8SPSMDB-372 fixed by ......"
   git push -u origin K8SPSMDB-372-fix-feature-X
   ```

   In the output you will see the link where to create a pull request.

   Sample output:

   ```
   remote: Create a pull request for 'K8SPSMDB-372-fix-feature-X' on GitHub by visiting:
   remote:      https://github.com/<your-name>/k8spsmdb-docs/pull/new/K8SPSMDB-372-fix-feature-X
   ```

7. Create a pull request on GitHub. The page shows the base branch - the one you offer your changes for, your commit message and a diff - a visual representation of your changes against the original page.  This allows you to make a last-minute review. When you are ready, click the **Create pull request** button.
8. When the reviewer makes some comments, address any feedback that comes and update the pull request. Read more about the process in the [code review](#code-review).
9. When your contribution is accepted, your pull request will be approved and merged to the main branch.

#### Code review

Your contribution will be reviewed by other developers contributing to the project. The more complex your changes are, the more experts will be involved. You will receive feedback and recommendations directly on your pull request on GitHub, so keep an eye on your submission and be prepared to make further amendments. The developers might even provide some concrete suggestions on how to modify your code to better match the project’s expectations.

### Building the documentation

To verify how your changes look, generate the static site with the documentation. This process is called *building*. 

#### Preconditions

1. Install [Python].

2. Install MkDocs and required extensions:

    ```sh
    pip install -r requirements.txt
    ```

#### Build the site

1. To build the site, run:

    ```sh
    mkdocs build
    ```

2. Open `site/index.html`

#### Live preview

To view your changes as you make them, run the following command:

```sh
mkdocs serve
```

Paste the <http://127.0.0.1:8000> in your browser and you will see the documentation. The page reloads automatically as you make changes.

#### PDF

To build the PDF documentation, open the `site/print_page.html` in your browser. Save it as PDF. Depending on the browser, you may need to select the Export to PDF, Print - Save as PDF or just Save and select PDF as the output format.

## After your pull request is merged

Once your pull request is merged, you are an official Percona Community Contributor. Welcome to the community!

## Repository structure

The repository includes the following directories and files:

- `mkdocs-base.yml` - the base configuration file. It includes general settings and documentation structure.
- `mkdocs.yml` - configuration file. Contains the settings for building the docs with Material theme.
- `docs`:
  - `*.md` - Source markdown files.
  - `assets` - Images, text snippets and templates
    - `images` - Images, logos and favicons
    - `fragments` - Text snippets used in multiple places in docs. 
    - `templates`:
      - `pdf_cover_page.tpl` - The PDF cover page template
  - `css` - Styles
  - `js` - Javascript files
- `_resource`: The set of Material theme templates with our customizations  
  - `.icons` - Custom icons used in the documentation
  - `overrides`:
    - `partials` - The layout templates for various parts of the documentation such as header, copyright and others.
    - `main.html` - The layout template for hosting the documentation on Percona website
    - `404.html` - The 404 page template
- `_resourcepdf` - The set of Material theme templates with our customizations for PDF builds
- `site` - This is where the output HTML files are put after the build

[Python]: https://www.python.org/downloads/