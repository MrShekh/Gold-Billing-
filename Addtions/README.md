# AM Jwellers WhatsApp Service

WhatsApp automation service for sending bill PDFs to customers.

## Features

- 📱 WhatsApp Web integration using puppeteer
- 🔗 QR code scanning for authentication
- 📄 PDF bill sending with attachments
- ✅ Customer phone number validation
- 🔄 Automatic session management

## API Endpoints

- `GET /` - Home page with connection status
- `GET /qr` - QR code page for WhatsApp authentication  
- `GET /status` - Get WhatsApp connection status
- `POST /send-bill` - Send bill PDF to customer
- `POST /test-message` - Send test message
- `POST /disconnect` - Disconnect WhatsApp session

## Environment Variables

- `PORT` - Service port (default: 5001)

## Deployment

This service is designed to be deployed on platforms that support:
- Node.js 20+
- Chrome/Chromium installation
- Persistent file storage for WhatsApp sessions

### Railway Deployment

1. Connect GitHub repo to Railway
2. Railway will auto-detect Node.js
3. Service will be available at provided URL
4. Use `/qr` endpoint to scan QR code for setup

## Local Development

```bash
npm install
npm start
```

Visit `http://localhost:5001/qr` to set up WhatsApp connection.

## How to Connect Other Systems

Any system can connect to this WhatsApp service using simple HTTP requests. Ensure the service is running and connected to WhatsApp (via QR code) before sending requests.

### 1. Check Connection Status

**Endpoint:** `GET /status`

**Response:**
```json
{
  "status": "connected",
  "phone": "919876543210",
  "isReady": true
}
```

### 2. Send a Bill with PDF Attachment

**Endpoint:** `POST /send-bill`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "phone": "9876543210",
  "customerName": "John Doe",
  "billNumber": "INV-1001",
  "pdfBuffer": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCB..." 
}
```
*Note: `pdfBuffer` must be a base64 encoded string of the PDF file. The phone number is automatically formatted (Indian country code `91` is added if missing).*

### 3. Send a Test Message

**Endpoint:** `POST /test-message`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "phone": "9876543210",
  "message": "Hello from your custom system!"
}
```

## Note

- Each deployment requires re-scanning QR code
- Service must stay running to maintain WhatsApp session
- Customer numbers must be valid WhatsApp numbers
