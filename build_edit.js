const fs = require('fs');

const content = fs.readFileSync('src/app/bills/new/page.tsx', 'utf8');

let newContent = content
  .replace('export default function NewBillPage() {', 'import { Suspense } from "react";\nimport { useSearchParams } from "next/navigation";\n\nfunction EditBillContent() {\n  const searchParams = useSearchParams();\n  const id = searchParams.get("id");')
  .replace('import { getCustomers, addBill, generateVoucherNo,', 'import { getCustomers, updateBill, getBillById,')
  .replace('const [vno, setVno] = useState("");', 'const [vno, setVno] = useState("");\n  const [loading, setLoading] = useState(true);')
  .replace('<h2>Create New Bill</h2>', '<h2>Edit Bill</h2>')
  .replace('Save Bill', 'Update Bill')
  .replace('Save Bill', 'Update Bill');

newContent = newContent.replace(
  /useEffect\(\(\) => \{\s+async function init\(\) \{[\s\S]*?init\(\);\s+\}, \[\]\);/,
  `useEffect(() => {
    async function init() {
      try {
        const custData = await getCustomers();
        setCustomers(custData);
        if (id) {
          const b = await getBillById(id as string);
          if (b) {
            setCid(b.customerId);
            setVno(b.voucherNo);
            setDate(b.date);
            if (b.items) {
               const i = b.items.filter(x => x.type === "ISSUE");
               if (i.length) setIssue(i);
               const r = b.items.filter(x => x.type === "RECEIVE");
               if (r.length) setRecv(r);
            }
            if (b.payments && b.payments.length) {
               setPays(b.payments.length < 4 ? [...b.payments, ...Array.from({length: 4 - b.payments.length}).map(() => makePayment())] : b.payments);
            }
            setPaidCash(b.paidCash || "");
            setRcptCash(b.receiptCash || "");
            setPrevBal(b.previousBalance || "");
            setClosBal(b.closingBalance || "");
            setDrNaam(b.drNaam || "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);`
);

newContent = newContent.replace(
  /await addBill\(\{/,
  `await updateBill(id as string, {`
);

// We need to return early if loading
newContent = newContent.replace(
  'return (',
  `if (loading) return <div>Loading...</div>;\n\n  return (`
);

newContent += `\n\nexport default function EditBillPage() {\n  return (\n    <Suspense fallback={<div>Loading...</div>}>\n      <EditBillContent />\n    </Suspense>\n  );\n}`;

fs.mkdirSync('src/app/bills/edit', { recursive: true });
fs.writeFileSync('src/app/bills/edit/page.tsx', newContent);
