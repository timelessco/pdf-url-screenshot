# PDF Screenshot Service

A high-performance Fastify server that generates thumbnail images from PDF documents and uploads them to Cloudflare R2 storage.

## Features

- 🚀 Fast PDF rendering using `pdfjs-dist` and `node-canvas`
- 📸 Generates PNG thumbnails from the first page of PDFs
- ☁️ Automatic upload to Cloudflare R2 storage
- 🔄 Process management with PM2
- 📝 Comprehensive logging and error handling
- 🔐 Production-ready TypeScript codebase

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PM2 (for production deployment)
- Cloudflare R2 credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-screenshot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example file
cp env.example .env

# Edit .env and add your actual credentials
nano .env
```

Required environment variables:
- `R2_ACCOUNT_ID` - Your Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key
- `R2_SECRET_ACCESS_KEY` - Your R2 secret key
- `R2_PUBLIC_BUCKET_URL` - Your public bucket URL
- `R2_MAIN_BUCKET_NAME` - Your R2 bucket name
- `PORT` - Server port (default: 3000)

4. Build the TypeScript code:
```bash
npm run build
```

## Development

Run the server in development mode:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Production Deployment with PM2

### First Time Setup

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Install PM2 log rotation:
```bash
pm2 install pm2-logrotate
```

3. Build and start the server:
```bash
npm run build
npm run pm2:start
```

4. Save PM2 configuration (optional, for auto-restart on system reboot):
```bash
pm2 save
pm2 startup
```

### PM2 Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:start` | Start the server with PM2 |
| `npm run pm2:stop` | Stop the server |
| `npm run pm2:restart` | Restart the server |
| `npm run pm2:delete` | Remove from PM2 |
| `npm run pm2:logs` | View real-time logs |
| `npm run pm2:status` | Check server status |

### Updating the Server

After making code changes:

```bash
npm run build
npm run pm2:restart
```

## API Endpoints

### Health Check

```http
GET /
```

**Response:**
```json
{
  "message": "Hello from Hetzner Node server falsify"
}
```

### Generate PDF Screenshot

```http
POST /upload/pdf-screenshot
```

**Request Body:**
```json
{
  "url": "https://example.com/document.pdf"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "path": "test/thumb-document.png",
  "publicUrl": "https://your-r2-domain.com/test/thumb-document.png"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Configuration

### PM2 Configuration (`ecosystem.config.js`)

- **instances**: Number of instances to run (default: 1)
- **max_memory_restart**: Auto-restart if memory exceeds limit (default: 1G)
- **autorestart**: Automatically restart on crashes
- **logs**: Stored in `./logs/` directory

### Log Rotation

PM2 automatically rotates logs with these settings:
- Max log size: 10MB
- Retained files: 30 old logs
- Compression: Enabled for old logs
- Check interval: Every 30 seconds

## Project Structure

```
pdf-screenshot/
├── index.ts              # Main server file with Fastify initialization
├── env.schema.ts         # Environment variable schema and types
├── types.ts              # TypeScript type definitions
├── r2Client.ts           # R2 storage client
├── routes/               # Route handlers
│   ├── root.ts           # GET / endpoint
│   └── upload/
│       └── pdf-screenshot.ts  # POST /upload/pdf-screenshot endpoint
├── ecosystem.config.js   # PM2 configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
├── dist/                 # Compiled JavaScript (generated)
└── logs/                 # PM2 logs (generated)
```

## Technical Details

### PDF Rendering

- Uses `pdfjs-dist` (version 3.4.120) for PDF parsing
- Renders to canvas with `node-canvas` (version 3.2.0)
- Default scale: 1.5x for better quality
- Output format: PNG

### Storage

- Uploads to Cloudflare R2 using AWS S3 SDK
- Automatic filename generation from PDF URL
- Returns public URL for immediate access

## Troubleshooting

### Check PM2 Status
```bash
npm run pm2:status
```

### View Logs
```bash
npm run pm2:logs
```

### Restart Server
```bash
npm run pm2:restart
```

### Clear and Restart
```bash
npm run pm2:delete
npm run build
npm run pm2:start
```

## License

ISC

## Author

Add your name/organization here

