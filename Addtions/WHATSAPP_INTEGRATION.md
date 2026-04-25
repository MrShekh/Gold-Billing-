# Adding WhatsApp Button to Bill View Page

In your existing `src/app/bills/[id]/page.tsx` (or wherever you show a single bill),
import and add the WhatsAppBillButton component.

## Example Integration

```tsx
// src/app/bills/[id]/page.tsx

import WhatsAppBillButton from "@/components/WhatsAppBillButton";
import BillPrint from "@/components/BillPrint";
import { useReactToPrint } from "react-to-print";

// Inside your component, near the Print button:

<div className="flex items-center gap-3 flex-wrap">
  {/* Existing print button */}
  <button onClick={handlePrint} className="...">
    Print Bill
  </button>

  {/* NEW: WhatsApp send button */}
  <WhatsAppBillButton
    billId={bill.id}
    customerId={bill.customer_id}
    customerPhone={bill.customer?.phone}   // pass customer phone
    onSent={() => console.log("Bill sent on WhatsApp")}
  />
</div>
```

## What the button does

1. Shows a green "Send on WhatsApp" button next to your Print button
2. On click → confirms with the user "Send to +91XXXXXXXXXX?"
3. Calls POST /api/whatsapp/send with billId + customerId
4. The API route:
   - Authenticates the user
   - Fetches WhatsApp credentials from `whatsapp_settings` table
   - Fetches the full bill with all items
   - Builds a formatted text message (all issue/receive items, totals, jama)
   - Sends via Meta WhatsApp Cloud API
   - Logs the send in `whatsapp_logs`
5. Button shows ✅ "Bill Sent on WhatsApp!" on success
6. Shows error message on failure with dismiss

## If customer has no phone
The button is greyed out with tooltip "Add customer phone number to enable"
