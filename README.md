# Website Source Code Extractor

A **full-stack web tool** that extracts the public frontend source code of any website by simply entering its URL.
The application analyzes the webpage and allows users to **view and download HTML, CSS, JavaScript, and other assets in a ZIP file**.

Built with **Python (Flask) for the backend** and **Vanilla JavaScript for the frontend**, this project demonstrates web scraping, API development, and full-stack integration.

---
## Application Preview

<p align="center">
  <img src="frontend/screenshot.png" width="900">
</p>
## Features

* Extract **HTML source code** from any reachable website
* Detect and list **CSS files and inline styles**
* Detect **JavaScript files and inline scripts**
* Extract **assets** such as images, fonts, audio, and video
* Generate **analysis statistics** (title, resource counts, etc.)
* Download extracted resources as a **ZIP package**
* Simple **frontend interface** for entering website URLs
* Backend API built using **Flask**

---

## Tech Stack

### Backend

* Python 3.9+
* Flask
* flask-cors
* requests
* BeautifulSoup4

### Frontend

* HTML
* CSS
* Vanilla JavaScript
* Fetch API

### Utilities

* urllib.parse (URL normalization)
* hashlib (session ID generation)
* zipfile (ZIP creation)
* tempfile / shutil / os (temporary file handling)

---

## Project Structure

```
WebsiteSourceExtractor/
│
├── backend/
│   └── app.py              # Flask API server
│
├── frontend/
│   ├── index.html          # Web interface
│   ├── app.js              # Frontend logic
│   └── style.css           # UI styling
│
└── README.md               # Project documentation
```

---

## How It Works

### 1. User Interaction

1. Open the frontend interface.
2. Enter a website URL.
3. Click **Extract Code**.

### 2. Backend Processing

The Flask API:

* Fetches the webpage using `requests`
* Parses the HTML using `BeautifulSoup`
* Extracts:

  * HTML structure
  * CSS links and inline styles
  * JavaScript files and inline scripts
  * Asset URLs (images, fonts, media)

### 3. Results Display

The frontend displays:

* Full HTML source
* CSS references
* JavaScript references
* Asset links
* Analysis statistics

### 4. ZIP Export

Users can download a ZIP containing:

```
html/
css/
js/
images/
assets/
README.md
```

---

## API Endpoints

### Extract Website Data

```
POST /api/extract
```

Example request:

```json
{
  "url": "https://example.com"
}
```

Response includes:

* HTML
* CSS references
* JavaScript references
* asset URLs
* analysis statistics
* session ID

---

### Download ZIP

```
POST /api/download-zip
```

Example request:

```json
{
  "url": "https://example.com",
  "session_id": "abc123"
}
```

Returns a downloadable ZIP containing extracted resources.

---

### Health Check

```
GET /api/health
```

Used to verify that the backend server is running.

---

## Running the Project Locally

### 1. Clone the Repository

```
git clone https://github.com/YOUR_USERNAME/website-source-extractor.git
cd website-source-extractor
```

---

### 2. Setup Backend

```
cd backend
python -m venv venv
```

Activate environment:

Windows

```
venv\Scripts\activate
```

Linux / macOS

```
source venv/bin/activate
```

Install dependencies:

```
pip install Flask flask-cors requests beautifulsoup4
```

Run the backend:

```
python app.py
```

Server will start at:

```
http://127.0.0.1:5000
```

---

### 3. Run the Frontend

Option 1 (simple):

Open

```
frontend/index.html
```

in your browser.

Option 2 (recommended):

```
cd frontend
python -m http.server 8080
```

Open:

```
http://localhost:8080
```

---

## Limitations

* Only **public website content** can be extracted
* Websites that rely heavily on **JavaScript rendering** may not fully load
* Some resources may fail to download due to:

  * CORS restrictions
  * blocked requests
  * missing files
* Not intended for large-scale scraping

---

## Ethical Use

This tool should be used **only for educational and research purposes**.

Respect:

* Website **terms of service**
* **robots.txt** rules
* Server load limits

Do not use this tool for **unauthorized scraping or content misuse**.

---

## Possible Improvements

Future enhancements may include:

* Technology detection (React, Angular, etc.)
* Asset preview in the UI
* Metadata extraction
* robots.txt compliance
* Rate limiting
* Authentication for API access

---

## Author

**Shaurya Parashar**

B.Tech Computer Science Engineering
Graphic Era University

---

## License

This project is intended for **educational purposes and learning demonstrations**.
