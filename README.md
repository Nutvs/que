# BOYdKO Christmas Concert — Queue Management (Next.js)

## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## Run on localhost
```bash
npm install
npm run dev
```

Then open:
- Admin: http://localhost:3000
- Customer TV: http://localhost:3000/?display=1

The Admin button **📺 เปิดหน้าจอลูกค้า** opens the customer display in a separate window.

## Current MVP behavior
- Manually enter queue numbers: `A101`, `001`, `VIP-08`, etc.
- Queue flow: `WAITING → PREPARING → READY → DONE`
- Staff can prepare any queue first; FIFO is not enforced.
- Multiple queues can be preparing/ready at the same time.
- No item-count field.
- Admin and customer display sync through `localStorage` + `BroadcastChannel` on the same browser/device.
- KV and the full BOYdKO Christmas logo are stored in `public/`.

## Important
This version is a localhost/same-browser MVP. It is **not yet a true internet/cloud backend**. If the TV is on another computer/device, the next step is to move the queue state to Supabase/Firebase (or your own API) so multiple POS machines and the TV share one central database.
