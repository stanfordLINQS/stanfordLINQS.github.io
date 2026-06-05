# LINQS Lab Website

Static HTML site for GitHub Pages, modeled after the [McMahon Lab](https://mcmahon.aep.cornell.edu/index.html) homepage layout.

## Local preview

Open `index.html` in a browser, or serve the folder locally:

```bash
cd Projects/linqs-website
python -m http.server 8000
```

Then visit http://localhost:8000

## GitHub Pages

1. Create a repository on GitHub (e.g. `linqs-website`).
2. Push this folder:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/linqs-website.git
   git add .
   git commit -m "Initial lab homepage"
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment → Source**: deploy from branch `main`, folder `/ (root)`.
4. Your site will be at `https://YOUR_USERNAME.github.io/linqs-website/`.

## Edit next

- Replace placeholder copy in `index.html` (lab name, focus line, research summary).
- Add a real logo under `images/` and update the header in each HTML file.
- Replace funding logo placeholders with real sponsor images.
- Fill in `people.html`, `research.html`, `publications.html`, and `contact.html`.
