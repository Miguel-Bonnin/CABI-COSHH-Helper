# MSDS Download Feature

## Overview

The COSHH Helper now allows you to download MSDS files directly from ChemInventory for any chemical in your inventory!

## How It Works

1. **Inventory has substanceId** - Each chemical stores its ChemInventory substance ID
2. **Proxy server** - A local Node.js server handles API requests (avoids CORS issues)
3. **File browser** - Click "📄 MSDS" button to see all linked files
4. **Direct download** - Files download from ChemInventory with time-sensitive URLs (30 min expiry)

## Setup (One-Time)

### Start the MSDS Proxy Server

```bash
cd admin-scripts
node msds-proxy.js
```

You should see:
```
📡 MSDS Proxy Server
====================
Server running at http://localhost:3000/

Endpoints:
  GET /files?substanceId=123    - List files for substance
  GET /download?fileId=456      - Get download URL for file

Press Ctrl+C to stop
```

**Keep this running while using the MSDS download feature!**

## Usage

### For Team Members

1. **Start proxy** (if not already running):
   ```bash
   node admin-scripts/msds-proxy.js
   ```

2. **Open COSHH Helper** on GitHub Pages or locally

3. **Go to Inventory tab**

4. **Find your chemical** (use search if needed)

5. **Click "📄 MSDS" button**

6. **File browser popup** shows:
   - File names
   - File sizes
   - Upload dates
   - Download buttons

7. **Click "Download"** on the MSDS you want

8. **File opens in new tab** - Download or view directly

## File Browser Features

The popup shows all files linked to that chemical's substance in ChemInventory:

- **Multiple files**: If a substance has several MSDS versions, they all appear
- **File info**: Shows size and upload date to help identify the right file
- **One-click download**: Each file has its own download button
- **Easy close**: Click outside popup or "Close" button

## Technical Details

### Why a Proxy Server?

Browsers block direct API calls to ChemInventory from GitHub Pages due to CORS (Cross-Origin Resource Sharing) restrictions. The proxy server:

- Runs on your local machine
- Makes API calls to ChemInventory on your behalf
- Adds CORS headers so the browser allows the requests
- Uses your API token securely (never sent to GitHub)

### API Endpoints Used

1. **`/filestore/getlinkedfiles`** - Lists files for a substance
2. **`/filestore/download`** - Gets time-sensitive download URL

### Data Flow

```
Browser → Proxy Server → ChemInventory API
   ↑                            ↓
   └────── Download URL ────────┘
```

## Troubleshooting

### "Failed to fetch MSDS files"

**Cause**: Proxy server not running

**Solution**:
```bash
cd admin-scripts
node msds-proxy.js
```

### "Proxy server returned 401"

**Cause**: API token invalid or expired

**Solution**:
1. Get new token from ChemInventory
2. Update `admin-scripts/api-token.txt`
3. Restart proxy server

### "No MSDS files found"

**Cause**: Chemical doesn't have files uploaded in ChemInventory

**Solution**: Upload MSDS in ChemInventory first, then try again

### Download link expires

**Cause**: ChemInventory download URLs expire after 30 minutes

**Solution**: Click the MSDS button again to get a fresh link

## Security

- ✅ API token stays on your local machine
- ✅ Proxy only runs locally (localhost:3000)
- ✅ Not accessible from internet
- ✅ Download URLs expire after 30 minutes
- ✅ No credentials stored in browser or GitHub

## Future Enhancements

Potential improvements:

1. **Auto-parse MSDS** - After download, automatically load into MSDS parser
2. **Favorite files** - Remember which file is the "official" MSDS
3. **File preview** - Show PDF thumbnail before downloading
4. **Batch download** - Download multiple files at once
5. **GitHub Actions** - Run proxy as cloud service (eliminates local requirement)

## FAQ

**Q: Do I need to run the proxy server every time?**
A: Yes, whenever you want to download MSDS files. It's quick to start (`node msds-proxy.js`).

**Q: Can multiple people use the same proxy?**
A: No, each person needs to run their own proxy with their own API token.

**Q: Will this work on GitHub Pages?**
A: Yes! The JavaScript runs on GitHub Pages, but you need the local proxy for API access.

**Q: What if I don't have a ChemInventory API token?**
A: Contact your ChemInventory administrator to generate one (requires Group Administrator privileges).

**Q: Can I download files that aren't MSDS?**
A: Yes! The feature shows ALL files linked to the substance in ChemInventory.

## Commands Reference

```bash
# Start proxy server
cd admin-scripts
node msds-proxy.js

# Update inventory (includes substanceId)
node fetch-inventory.js --token api-token.txt

# Check if proxy is running
curl http://localhost:3000/files?substanceId=123
```

---

**Version**: 1.0 (2025-01-17)