# The Brewtique — QR Ordering System

A complete QR-code based table ordering system for your café.

## What's included

- **Customer menu** (`/menu?table=N`) — scan QR, browse menu, add to cart, place order or call waiter
- **Staff dashboard** (`/dashboard`) — live feed of orders & waiter calls with table numbers, auto-refreshes every 5 seconds
- **Menu editor** (`/admin`) — add/remove menu items without touching code
- **QR code generator** (`/qrcodes`) — generates & prints a QR code for every table, each one auto-links to that table's menu

## How to run it

1. Install Node.js (v18+) if you don't already have it: https://nodejs.org
2. Open a terminal in this folder and run:
   ```
   npm install
   npm start
   ```
   (if `npm start` doesn't work, run `node server.js` instead)
3. Open these in your browser:
   - Dashboard (for staff): http://localhost:3000/dashboard
   - QR codes (to print): http://localhost:3000/qrcodes
   - Menu editor: http://localhost:3000/admin
   - Customer menu preview: http://localhost:3000/menu?table=1

## How table detection works

Each table gets its own QR code that encodes a URL like:
```
https://yourdomain.com/menu?table=7
```
When a customer scans it, the page automatically reads `table=7` from the link — no manual typing needed. Their order and "call waiter" requests are tagged with that table number and show up instantly on the staff dashboard.

## Going live (putting this on the internet)

Right now this runs on your computer only (`localhost`). To make it work with real QR codes customers can scan on their phones, you'll need to host it somewhere public. Good simple options:
- **Render** (render.com) — free tier, very simple for Node apps
- **Railway** (railway.app) — free tier, also simple
- **A VPS** (DigitalOcean, etc.) — more control, costs a few dollars/month

Once hosted, regenerate your QR codes from the `/qrcodes` page — it'll automatically use your live domain instead of `localhost`.

## Customizing menu items

Go to `/admin` to add, or remove items — no code needed. Categories are created automatically based on what you type (e.g. typing "Desserts" as a category creates a new "Desserts" section on the menu).

## Notes

- Orders are stored in `db/db.json` — a simple file-based database, no separate database server needed.
- This is a clean starting point. Natural next additions: order history/analytics, kitchen printer integration, payment collection, multiple staff logins.
