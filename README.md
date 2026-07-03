<p align="center">
  <img src="https://github.com/hnibert/ace-prototype/blob/main/assets/images/logos/ace_logo.png" alt="Project Logo" width="200">
</p>

<h1 align="center">ACE Portal | Jekyll Prototype</h1>

[![Deployment Status](https://github.com/hnibert/ace-prototype/actions/workflows/jekyll.yml/badge.svg)](https://github.com/hnibert/ace-prototype/actions/workflows/jekyll.yml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/hnibert/ace-prototype)
![GitHub last commit](https://img.shields.io/github/last-commit/hnibert/ace-prototype)
![GitHub repo size](https://img.shields.io/github/repo-size/hnibert/ace-prototype)


## About

Alaska’s fisheries and marine ecosystems are changing as the climate shifts, bringing new challenges for resource managers, 
fishing communities, and decision-makers. We are working to provide people with tools and information that supports 
decision-making as we navigate these changing conditions.

**Live Site:** [ACE Portal - Jekyll Prototype](https://hnibert.github.io/ace-prototype/)

## Features

The ACE Portal is a Jekyll website hosted on GitHub Pages and managed with Decap CMS which combines the speed of 
static hosting with a dynamic web editor. This stack operates with zero server maintenance, zero database dependencies, 
and absolute zero hosting costs.
  
  ### Hosting & Performance Features (GitHub Pages & Jekyll)

  - **Serverless Infrastructure:** Built on completely static HTML, CSS, and JS.

  - **Lightning-Fast Deliverability:** Delivered globally using GitHub's built-in CDN networks.

  - **Automated Builds:** Triggered instantly via GitHub Actions whenever content changes.

  - **Custom Domain Support:** Includes free SSL certificates automatically provisioned by GitHub.

  - **Native Markdown Processing:** Compiles standard Markdown into styled web pages natively.

  - **SEO Optimized Foundations:** Handled via plugins like `jekyll-seo-tag` for automated metadata.

  ### Content Management Features (Decap CMS)

  - **Git-Backed Architecture:** Saves updates directly into the repository as file commits.

  - **No Database Needed:** Relies entirely on structured text files and YAML front-matter.

  - **Rich Text Editing:** Features a clean, distraction-free WYSIWYG or raw Markdown editor.

  - **Real-Time Split Preview:** Displays how content will look directly alongside the editor.

  - **Dynamic Collections:** Organizes custom types like posts, species, regions, etc.

  - **Complex Media Handling:** Links directly to local asset folders or scales up to Cloudinary.

  - **Global Search:** Allows editors to query items using titles, slugs, or nested entry data.

  ### Developer & Editorial Control Features

  - **Flexible UI Customization:** Configured completely inside a human-readable config.yml file.

  - **Robust Input Widgets:** Includes data types like strings, dates, maps, lists, and relations.

  - **Variable Layout Blocks:** Enables complex page building through nested repeatable widgets.

  - **Secure GitHub OAuth:** Limits CMS panel access exclusively to authorized repository contributors.
  
  - **Editorial Workflow System:** Moves posts securely through Draft, In Review, and Ready stages before publishing.

  - **Full Revision History:** Leverages native Git history to trace every single edit to its author.

### DecapBridge Authentication Features

  - **No GitHub Account Required:** External clients can log into the CMS via email without needing a GitHub profile.

  - **Single Sign-On (SSO):** Supports zero-config "Login with Google" and "Login with Microsoft" OAuth flows via PKCE.

  - **Self-Service Resets:** Users can manage their own forgotten passwords without manual administrative intervention.

  - **Email Invitation System:** Allows administrators to dispatch quick email access links to new contributors.

  - **Centralized Access Dashboard:** Grants admins a portal to monitor, invite, or instantly revoke collaborator permissions.

## Tech Stack

| Ruby | Bundler | Jekyll | Decap | DecapBridge |
|:----:|:--------:|:------:|:------:|:------:|
| **4.0.5** | **4.0.12** | **4.4.1** | **3.0.0** | **SaaS** |

---

This site is built on a serverless Jamstack architecture designed for high performance, security, and a streamlined editorial workflow.

- **Static site generator:** Jekyll
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions
- **CMS:** Decap CMS
- **Authentication:** DecapBridge (OAuth 2.0 + PKCE)

## Libaries & Utilities

| Bootstrap | Minisearch JS | Font Awesome (Free)
|:----:|:--------:|:--------:|
| **5.3.8** | **7.2.0** | **7.3.0**

---

Bootstrap, Minisearch JS, and custom Vanilla JS components create a highly optimized, lightweight frontend that delivers fast, client-side performance without the unnecessary overhead of heavy JavaScript frameworks.

- **Bootstrap:** UI styling framework
- **Minisearch JS:** Client-side text search
- **Font Awesome:** Optimized, inline SVG iconography
- **Custom JS Components:** Proprietary, lightweight interactive UI elements
