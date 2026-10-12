/**
 * @NApiVersion 2.1
 */
define([], () => {
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    function renderPackingList(data) {
        const rows = data.items.map((item) => `<tr><td><input type="checkbox" aria-label="Packed ${escape(item.name)}"></td><td>${escape(item.order)}</td><td>${escape(item.name)}</td><td>${escape(item.description)}</td><td>${escape(item.quantity)} ${escape(item.units)}</td></tr>`).join('');
        return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packing list ${escape(data.number)}</title><style>
        body{font:16px system-ui,sans-serif;color:#17212b;margin:32px auto;padding:0 24px;max-width:960px}h1{margin-bottom:8px}header{border-bottom:2px solid #17212b;padding-bottom:20px}pre{font:inherit;white-space:pre-wrap}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px;border-bottom:1px solid #ccc}input{width:20px;height:20px}button{padding:10px 18px;cursor:pointer}footer{margin-top:40px}@media print{button{display:none}body{margin:0;max-width:none}tr{break-inside:avoid}}
        </style></head><body><header><h1>Packing list</h1><p>${escape(data.number)}</p><p>Customer: ${escape(data.customer)}</p></header><h2>Ship to by order</h2><pre>${escape(data.address)}</pre><table><thead><tr><th>Packed</th><th>Sales order</th><th>Item</th><th>Description</th><th>Quantity</th></tr></thead><tbody>${rows}</tbody></table>${data.items.length ? '' : '<p>No items to pack.</p>'}<footer>Packed by: ____________________ &nbsp; Date: ____________________</footer><p><button type="button" onclick="window.print()">Print packing list</button></p></body></html>`;
    }

    return { renderPackingList };
});
