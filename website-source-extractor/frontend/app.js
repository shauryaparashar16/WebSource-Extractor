// Website Source Code Extractor - Complete Implementation with ZIP Download
class SourceCodeExtractor {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:5000';
        this.currentData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submission
        const form = document.getElementById('urlForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Download ZIP button
        const downloadBtn = document.getElementById('downloadZipBtn');
        downloadBtn.addEventListener('click', () => this.downloadZip());

        // Modal close on background click
        const modal = document.getElementById('downloadModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideDownloadModal();
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a valid URL');
            return;
        }

        this.showLoading(true);
        this.clearResults();
        this.hideError();

        try {
            const response = await fetch(`${this.apiUrl}/api/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            this.currentData = data;
            this.displayResults(data);
            this.showResultsSection();

        } catch (error) {
            this.showError(`Failed to extract code: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async downloadZip() {
        if (!this.currentData || !this.currentData.session_id) {
            this.showError('No extraction data available. Please extract a website first.');
            return;
        }

        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();

        this.showDownloadModal();

        try {
            const response = await fetch(`${this.apiUrl}/api/download-zip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    session_id: this.currentData.session_id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Handle file download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            // Extract domain name for filename
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            const domain = urlObj.hostname.replace('www.', '');
            link.download = `website_source_${domain}.zip`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            this.hideDownloadModal();
            this.showSuccessMessage('ZIP file downloaded successfully!');

        } catch (error) {
            this.hideDownloadModal();
            this.showError(`Failed to download ZIP: ${error.message}`);
        }
    }

    showDownloadModal() {
        const modal = document.getElementById('downloadModal');
        modal.style.display = 'block';
    }

    hideDownloadModal() {
        const modal = document.getElementById('downloadModal');
        modal.style.display = 'none';
    }

    showSuccessMessage(message) {
        // Create temporary success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-success);
            color: var(--color-background);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            z-index: 1001;
            font-family: var(--font-primary);
            font-weight: 500;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 5000);
    }

    displayResults(data) {
        this.displayAnalysis(data.analysis);
        this.displayHTML(data.html);
        this.displayCSS(data.css);
        this.displayJavaScript(data.javascript);
        this.displayAssets(data.assets);
    }

    displayAnalysis(analysis) {
        const analysisGrid = document.getElementById('analysisGrid');
        analysisGrid.innerHTML = '';

        const analysisItems = [
            { label: 'Website Title', value: analysis.title || 'N/A' },
            { label: 'HTML Size', value: analysis.html_size || 'N/A' },
            { label: 'CSS Files', value: analysis.total_css_files || '0' },
            { label: 'JS Files', value: analysis.total_js_files || '0' },
            { label: 'Assets', value: analysis.total_assets || '0' },
            { label: 'Meta Tags', value: analysis.meta_tags || '0' },
            { label: 'Links', value: analysis.links || '0' },
            { label: 'Analyzed URL', value: this.truncateUrl(analysis.url || '') }
        ];

        analysisItems.forEach(item => {
            const analysisItem = document.createElement('div');
            analysisItem.className = 'analysis-item';
            analysisItem.innerHTML = `
                <div class="label">${item.label}</div>
                <div class="value">${item.value}</div>
            `;
            analysisGrid.appendChild(analysisItem);
        });
    }

    displayHTML(html) {
        const htmlResult = document.getElementById('htmlResult');
        htmlResult.textContent = html || 'No HTML content found';
    }

    displayCSS(cssFiles) {
        const cssResult = document.getElementById('cssResult');
        const cssCount = document.getElementById('cssCount');
        
        cssResult.innerHTML = '';
        cssCount.textContent = `${cssFiles.length} file${cssFiles.length !== 1 ? 's' : ''}`;

        if (cssFiles.length === 0) {
            cssResult.innerHTML = '<div class="file-item">No CSS files found</div>';
            return;
        }

        cssFiles.forEach((css, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            if (css.type === 'external') {
                fileItem.innerHTML = `
                    <div class="file-header">
                        <span class="file-type">External CSS</span>
                    </div>
                    <a href="${css.url}" target="_blank" class="file-url">${css.url}</a>
                `;
            } else if (css.type === 'inline') {
                fileItem.innerHTML = `
                    <div class="file-header">
                        <span class="file-type">Inline CSS</span>
                        <button class="copy-btn" onclick="app.copyToClipboard('css-${index}')">Copy</button>
                    </div>
                    <div class="file-content" id="css-${index}">${this.escapeHtml(css.content)}</div>
                `;
            }

            cssResult.appendChild(fileItem);
        });
    }

    displayJavaScript(jsFiles) {
        const jsResult = document.getElementById('jsResult');
        const jsCount = document.getElementById('jsCount');
        
        jsResult.innerHTML = '';
        jsCount.textContent = `${jsFiles.length} file${jsFiles.length !== 1 ? 's' : ''}`;

        if (jsFiles.length === 0) {
            jsResult.innerHTML = '<div class="file-item">No JavaScript files found</div>';
            return;
        }

        jsFiles.forEach((js, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            if (js.type === 'external') {
                fileItem.innerHTML = `
                    <div class="file-header">
                        <span class="file-type">External JS</span>
                    </div>
                    <a href="${js.url}" target="_blank" class="file-url">${js.url}</a>
                `;
            } else if (js.type === 'inline') {
                fileItem.innerHTML = `
                    <div class="file-header">
                        <span class="file-type">Inline JS</span>
                        <button class="copy-btn" onclick="app.copyToClipboard('js-${index}')">Copy</button>
                    </div>
                    <div class="file-content" id="js-${index}">${this.escapeHtml(js.content)}</div>
                `;
            }

            jsResult.appendChild(fileItem);
        });
    }

    displayAssets(assets) {
        const assetsResult = document.getElementById('assetsResult');
        const assetsCount = document.getElementById('assetsCount');
        
        assetsResult.innerHTML = '';
        assetsCount.textContent = `${assets.length} file${assets.length !== 1 ? 's' : ''}`;

        if (assets.length === 0) {
            assetsResult.innerHTML = '<div class="file-item">No assets found</div>';
            return;
        }

        // Group assets by type
        const groupedAssets = this.groupAssetsByType(assets);

        Object.entries(groupedAssets).forEach(([type, assetList]) => {
            const groupHeader = document.createElement('h4');
            groupHeader.textContent = `${type.toUpperCase()} (${assetList.length})`;
            groupHeader.style.color = 'var(--color-primary)';
            groupHeader.style.marginBottom = '1rem';
            groupHeader.style.textTransform = 'capitalize';
            assetsResult.appendChild(groupHeader);

            assetList.forEach(asset => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-header">
                        <span class="file-type">${asset.type}</span>
                    </div>
                    <a href="${asset.url}" target="_blank" class="file-url">${asset.url}</a>
                `;
                assetsResult.appendChild(fileItem);
            });
        });
    }

    groupAssetsByType(assets) {
        return assets.reduce((groups, asset) => {
            const type = asset.type || 'other';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(asset);
            return groups;
        }, {});
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
    }

    clearResults() {
        document.getElementById('htmlResult').textContent = '';
        document.getElementById('cssResult').innerHTML = '';
        document.getElementById('jsResult').innerHTML = '';
        document.getElementById('assetsResult').innerHTML = '';
        document.getElementById('analysisGrid').innerHTML = '';
    }

    showResultsSection() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const originalText = event.target.textContent;
            event.target.textContent = 'Copied!';
            setTimeout(() => {
                event.target.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateUrl(url, maxLength = 50) {
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }
}

// Global copy function for inline onclick handlers
function copyToClipboard(elementId) {
    app.copyToClipboard(elementId);
}

// Initialize the application
const app = new SourceCodeExtractor();

// Check backend connection on load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${app.apiUrl}/api/health`);
        if (!response.ok) {
            throw new Error('Backend not responding');
        }
        console.log('✅ Backend connection successful');
    } catch (error) {
        console.warn('⚠️ Backend connection failed. Make sure your Flask server is running on http://127.0.0.1:5000');
        app.showError('Backend server is not running. Please start your Flask server first.');
    }
});
