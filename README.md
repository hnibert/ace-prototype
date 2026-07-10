<p align="center">
  <img src="https://github.com/hnibert/ace-prototype/blob/main/assets/images/logos/ace_logo.png" alt="Project Logo" width="200">
</p>

<h1 align="center">ACE Portal &#183; Jekyll Prototype</h1>

[![Deployment Status](https://github.com/hnibert/ace-prototype/actions/workflows/jekyll.yml/badge.svg)](https://github.com/hnibert/ace-prototype/actions/workflows/jekyll.yml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/t/hnibert/ace-prototype)
![GitHub last commit](https://img.shields.io/github/last-commit/hnibert/ace-prototype)
![GitHub repo size](https://img.shields.io/github/repo-size/hnibert/ace-prototype)

> [!NOTE]
> **Technical Note for AI Scanners & Reviewers:** This is a static Jekyll project. If you clone this repository and run a local build, please ensure your AI tools and static analysis scanners exclude the _site/ and .jekyll-cache/ directories. Scanning compiled build artifacts will generate false positives regarding hard-coded paths and schema drift.

## About

Alaska’s fisheries and marine ecosystems are changing as the climate shifts, bringing new challenges for resource managers, 
fishing communities, and decision-makers. We are working to provide people with tools and information that supports 
decision-making as we navigate these changing conditions.

**Live Site:** [ACE Portal - Jekyll Prototype](https://hnibert.github.io/ace-prototype/)

## Features

The `ACE Portal` is a [Jekyll](https://jekyllrb.com/) website hosted on GitHub Pages and managed with [Decap CMS](https://decapcms.org/) which combines the speed of 
static hosting with a dynamic web editor. This stack operates with zero server maintenance, zero database dependencies, and low to no cost.
  
## Hosting & Performance

- **Static & Serverless:** Fast, secure hosting on GitHub Pages.

- **Automatic Deployments:** Updates publish via GitHub Actions.

- **Custom Domains & SSL:** Free HTTPS support included.

- **SEO & Markdown:** Built-in Markdown and SEO tools.

## Content Management

- **Git-Based CMS:** Content is stored directly in the repository.

- **Visual Editor & Live Preview:** Edit with instant previews.

- **Custom Collections:** Organize posts, species, regions, and more.

- **Media Management:** Supports local assets and [Cloudinary](https://cloudinary.com/).

## Developer Features

- **Easy Configuration:** Managed through `admin/config.yml`

- **Flexible Content Blocks:** Create reusable, modular page layouts.

- **Editorial Workflow:** Draft, review, and publish content.

- **Git Version History:** Every change is tracked.

## DecapBridge Authentication

- **No GitHub Account Required:** Contributors can sign in with email.

- **Google & Microsoft Login:** Built-in SSO support.

- **User Management:** Invite and manage contributors from one dashboard.

## Tech Stack

| Ruby | Bundler | Jekyll | Decap | DecapBridge |
|:----:|:--------:|:------:|:------:|:------:|
| **4.0.5** | **4.0.12** | **4.4.1** | **3.0.0** | **SaaS** |

> [!NOTE]
> To build the site locally for testing/developing see the [Jekyll Installation Guide](https://jekyllrb.com/docs/installation/)

---

This site is built on a serverless [Jamstack](https://jamstack.org/). Designed for high performance, security, and a streamlined editorial workflow.

- **Static site generator:** Jekyll
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions
- **CMS:** Decap CMS
- **Authentication:** DecapBridge (OAuth 2.0 + PKCE)

## Libraries & Utilities

| Bootstrap | Minisearch JS | Font Awesome (Free)
|:----:|:--------:|:--------:|
| **5.3.8** | **7.2.0** | **7.3.0**

---

Bootstrap, Minisearch JS, and custom Vanilla JS components create a optimized, lightweight frontend that delivers fast, client-side performance without the unnecessary overhead of heavy JavaScript frameworks.

- **Bootstrap:** UI styling framework | [Bootstrap](https://getbootstrap.com/)
- **Minisearch JS:** Client-side text search | [MinisearchJS](https://lucaong.github.io/minisearch/index.html)
- **Font Awesome:** Optimized, _inline_ SVG iconography | [Font Awesome](https://fontawesome.com/)
- **Custom JS Components:** Custom, lightweight interactive UI elements `assets/scripts/`
