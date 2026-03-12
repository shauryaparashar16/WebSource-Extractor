from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import os
import zipfile
import tempfile
import shutil
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Create a temporary directory for storing downloads
TEMP_DIR = tempfile.mkdtemp()

@app.route('/api/extract', methods=['POST'])
def extract_website_code():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        # Validate URL
        parsed = urlparse(url)
        if not parsed.netloc:
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Fetch the webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract HTML (prettified)
        html_code = soup.prettify()
        
        # Extract CSS files
        css_files = []
        
        # External CSS files
        for link in soup.find_all('link', rel='stylesheet', href=True):
            css_url = urljoin(url, link['href'])
            css_files.append({
                'type': 'external',
                'url': css_url,
                'element': str(link)
            })
        
        # Inline CSS
        for style in soup.find_all('style'):
            if style.string:
                css_files.append({
                    'type': 'inline',
                    'content': style.string.strip()
                })
        
        # Extract JavaScript files
        js_files = []
        
        # External JS files
        for script in soup.find_all('script', src=True):
            js_url = urljoin(url, script['src'])
            js_files.append({
                'type': 'external',
                'url': js_url,
                'element': str(script)
            })
        
        # Inline JavaScript
        for script in soup.find_all('script'):
            if script.string and not script.get('src'):
                js_files.append({
                    'type': 'inline',
                    'content': script.string.strip()
                })
        
        # Extract assets (images, fonts, videos, etc.)
        assets = []
        
        # Images
        for img in soup.find_all('img', src=True):
            asset_url = urljoin(url, img['src'])
            assets.append({
                'type': 'image',
                'url': asset_url,
                'element': str(img)
            })
        
        # Background images in inline styles
        for element in soup.find_all(style=True):
            style_content = element['style']
            bg_images = re.findall(r'background-image:\s*url\([\'"]?([^\'")]+)[\'"]?\)', style_content)
            for bg_img in bg_images:
                asset_url = urljoin(url, bg_img)
                assets.append({
                    'type': 'background-image',
                    'url': asset_url,
                    'element': str(element)
                })
        
        # Fonts
        for link in soup.find_all('link', href=True):
            if 'font' in link.get('href', '').lower():
                font_url = urljoin(url, link['href'])
                assets.append({
                    'type': 'font',
                    'url': font_url,
                    'element': str(link)
                })
        
        # Videos
        for video in soup.find_all('video', src=True):
            video_url = urljoin(url, video['src'])
            assets.append({
                'type': 'video',
                'url': video_url,
                'element': str(video)
            })
        
        # Audio
        for audio in soup.find_all('audio', src=True):
            audio_url = urljoin(url, audio['src'])
            assets.append({
                'type': 'audio',
                'url': audio_url,
                'element': str(audio)
            })
        
        # Generate analysis
        analysis = {
            'url': url,
            'title': soup.title.string if soup.title else 'No title',
            'total_css_files': len(css_files),
            'total_js_files': len(js_files),
            'total_assets': len(assets),
            'html_size': f"{len(html_code)} characters",
            'meta_tags': len(soup.find_all('meta')),
            'links': len(soup.find_all('a', href=True))
        }
        
        # Generate session ID for ZIP download
        session_id = hashlib.md5(f"{url}_{datetime.now().isoformat()}".encode()).hexdigest()
        
        return jsonify({
            'success': True,
            'html': html_code,
            'css': css_files,
            'javascript': js_files,
            'assets': assets,
            'analysis': analysis,
            'session_id': session_id
        })
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout - website took too long to respond'}), 408
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Connection error - could not reach the website'}), 503
    except requests.exceptions.HTTPError as e:
        return jsonify({'error': f'HTTP error: {e.response.status_code}'}), e.response.status_code
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/download-zip', methods=['POST'])
def download_zip():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        session_id = data.get('session_id', '')
        
        if not url or not session_id:
            return jsonify({'error': 'URL and session_id are required'}), 400
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Create unique directory for this download
        download_dir = os.path.join(TEMP_DIR, session_id)
        if os.path.exists(download_dir):
            shutil.rmtree(download_dir)
        os.makedirs(download_dir)
        
        # Fetch the webpage again
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Create folder structure
        html_dir = os.path.join(download_dir, 'html')
        css_dir = os.path.join(download_dir, 'css')
        js_dir = os.path.join(download_dir, 'js')
        images_dir = os.path.join(download_dir, 'images')
        assets_dir = os.path.join(download_dir, 'assets')
        
        for directory in [html_dir, css_dir, js_dir, images_dir, assets_dir]:
            os.makedirs(directory, exist_ok=True)
        
        # Save main HTML file
        with open(os.path.join(html_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        
        # Download and save CSS files
        css_count = 0
        for link in soup.find_all('link', rel='stylesheet', href=True):
            try:
                css_url = urljoin(url, link['href'])
                css_response = requests.get(css_url, headers=headers, timeout=10)
                css_response.raise_for_status()
                
                css_filename = f"style_{css_count}.css"
                with open(os.path.join(css_dir, css_filename), 'w', encoding='utf-8') as f:
                    f.write(css_response.text)
                css_count += 1
            except Exception as e:
                print(f"Failed to download CSS: {css_url} - {e}")
        
        # Save inline CSS
        inline_css_count = 0
        for style in soup.find_all('style'):
            if style.string:
                css_filename = f"inline_style_{inline_css_count}.css"
                with open(os.path.join(css_dir, css_filename), 'w', encoding='utf-8') as f:
                    f.write(style.string.strip())
                inline_css_count += 1
        
        # Download and save JavaScript files
        js_count = 0
        for script in soup.find_all('script', src=True):
            try:
                js_url = urljoin(url, script['src'])
                js_response = requests.get(js_url, headers=headers, timeout=10)
                js_response.raise_for_status()
                
                js_filename = f"script_{js_count}.js"
                with open(os.path.join(js_dir, js_filename), 'w', encoding='utf-8') as f:
                    f.write(js_response.text)
                js_count += 1
            except Exception as e:
                print(f"Failed to download JS: {js_url} - {e}")
        
        # Save inline JavaScript
        inline_js_count = 0
        for script in soup.find_all('script'):
            if script.string and not script.get('src'):
                js_filename = f"inline_script_{inline_js_count}.js"
                with open(os.path.join(js_dir, js_filename), 'w', encoding='utf-8') as f:
                    f.write(script.string.strip())
                inline_js_count += 1
        
        # Download images
        img_count = 0
        for img in soup.find_all('img', src=True):
            try:
                img_url = urljoin(url, img['src'])
                img_response = requests.get(img_url, headers=headers, timeout=10)
                img_response.raise_for_status()
                
                # Get file extension from URL or content type
                parsed_img_url = urlparse(img_url)
                img_path = parsed_img_url.path
                img_ext = os.path.splitext(img_path)[1] or '.jpg'
                
                img_filename = f"image_{img_count}{img_ext}"
                with open(os.path.join(images_dir, img_filename), 'wb') as f:
                    f.write(img_response.content)
                img_count += 1
            except Exception as e:
                print(f"Failed to download image: {img_url} - {e}")
        
        # Download other assets (fonts, videos, etc.)
        asset_count = 0
        asset_selectors = [
            ('link[href*="font"]', 'href', 'font'),
            ('video[src]', 'src', 'video'),
            ('audio[src]', 'src', 'audio')
        ]
        
        for selector, attr, asset_type in asset_selectors:
            for element in soup.select(selector):
                try:
                    asset_url = urljoin(url, element.get(attr))
                    asset_response = requests.get(asset_url, headers=headers, timeout=10)
                    asset_response.raise_for_status()
                    
                    parsed_asset_url = urlparse(asset_url)
                    asset_path = parsed_asset_url.path
                    asset_ext = os.path.splitext(asset_path)[1] or '.bin'
                    
                    asset_filename = f"{asset_type}_{asset_count}{asset_ext}"
                    with open(os.path.join(assets_dir, asset_filename), 'wb') as f:
                        f.write(asset_response.content)
                    asset_count += 1
                except Exception as e:
                    print(f"Failed to download {asset_type}: {asset_url} - {e}")
        
        # Create README file
        readme_content = f"""# Website Source Code Extract

Extracted from: {url}
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Folder Structure:
- html/index.html - Main HTML file
- css/ - CSS stylesheets (external and inline)
- js/ - JavaScript files (external and inline)
- images/ - Image assets
- assets/ - Other assets (fonts, videos, audio)

## Note:
This extraction includes the frontend source code and assets that were publicly accessible.
Some external resources may not have been downloaded due to access restrictions or errors.
"""
        
        with open(os.path.join(download_dir, 'README.md'), 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        # Create ZIP file
        zip_filename = f"website_source_{session_id}.zip"
        zip_path = os.path.join(TEMP_DIR, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(download_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, download_dir)
                    zipf.write(file_path, arcname)
        
        # Clean up download directory
        shutil.rmtree(download_dir)
        
        return send_file(
            zip_path,
            as_attachment=True,
            download_name=f"website_source_{urlparse(url).netloc}.zip",
            mimetype='application/zip'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to create ZIP: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Website Source Code Extractor API is running'})

if __name__ == '__main__':
    print("Starting Website Source Code Extractor API...")
    print("Visit http://127.0.0.1:5000/api/health to check if the API is running")
    app.run(debug=True, host='127.0.0.1', port=5000)
