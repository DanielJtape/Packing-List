/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/log', './render'], (ui, record, search, log, renderer) => {
    const validId = (id) => /^[1-9]\d*$/.test(String(id)) && Number.isSafeInteger(Number(id));

    function showForm(response, customerId, message) {
        const form = ui.createForm({ title: 'Customer packing list' });
        const customer = form.addField({ id: 'custpage_customer', type: ui.FieldType.SELECT, label: 'Customer', source: 'customer' });
        customer.isMandatory = true;
        if (validId(customerId)) {
            customer.defaultValue = String(customerId);
            const orders = form.addField({ id: 'custpage_orders', type: ui.FieldType.MULTISELECT, label: 'Sales orders (select one or more)' });
            orders.isMandatory = true;
            search.create({ type: search.Type.SALES_ORDER, filters: [
                ['mainline', 'is', 'T'], 'and', ['entity', 'anyof', customerId]
            ], columns: [search.createColumn({ name: 'internalid', sort: search.Sort.DESC }), 'tranid', 'trandate'] }).run().each((result) => {
                orders.addSelectOption({ value: String(result.id), text: `${result.getValue('tranid')} — ${result.getValue('trandate')}` });
                return true;
            });
            const note = form.addField({ id: 'custpage_help', type: ui.FieldType.INLINEHTML, label: 'Help' });
            note.defaultValue = '<p>Select sales orders to print. If you change customer, clear the order selection and submit to load that customer’s orders. The newest 4,000 orders are shown.</p>';
        }
        if (message) {
            const notice = form.addField({ id: 'custpage_notice', type: ui.FieldType.INLINEHTML, label: 'Notice' });
            notice.defaultValue = '<p role="alert">Unable to open the selected orders. Select up to 20 orders belonging to this customer and check your role permissions.</p>';
        }
        form.addSubmitButton({ label: validId(customerId) ? 'Print selected orders / refresh customer' : 'Load customer orders' });
        response.writePage(form);
    }

    function onRequest(context) {
        const parameters = context.request.parameters;
        const customerId = parameters.custpage_customer;
        const orderIds = String(parameters.custpage_orders || '').split(/[\u0005,]/).filter(Boolean);
        if (!validId(customerId)) {
            showForm(context.response);
            return;
        }
        try {
            if (!orderIds.length) {
                showForm(context.response, customerId);
                return;
            }
            if (orderIds.length > 20 || orderIds.some((id) => !validId(id)) || new Set(orderIds).size !== orderIds.length) {
                showForm(context.response, customerId, true);
                return;
            }
            const items = [];
            const numbers = [];
            const addresses = [];
            let customer;
            for (const id of orderIds) {
                const order = record.load({ type: record.Type.SALES_ORDER, id: Number(id), isDynamic: false });
                if (String(order.getValue({ fieldId: 'entity' })) !== String(customerId)) throw new Error('Order does not belong to selected customer');
                const number = order.getValue({ fieldId: 'tranid' });
                numbers.push(number);
                customer = order.getText({ fieldId: 'entity' });
                addresses.push(`${number}\n${order.getValue({ fieldId: 'shipaddress' }) || ''}`);
                for (let line = 0; line < order.getLineCount({ sublistId: 'item' }); line++) {
                    const get = (fieldId) => order.getSublistValue({ sublistId: 'item', fieldId, line });
                    const type = get('itemtype');
                    const closed = get('isclosed');
                    if (closed === true || closed === 'T' || !['InvtPart', 'Assembly', 'NonInvtPart', 'Kit'].includes(type)) continue;
                    const remaining = Math.max(0, Number(get('quantity')) - Number(get('quantityshiprecv') || 0));
                    if (!Number.isFinite(remaining) || remaining <= 0) continue;
                    items.push({ order: number, name: order.getSublistText({ sublistId: 'item', fieldId: 'item', line }), description: get('description'), quantity: remaining, units: order.getSublistText({ sublistId: 'item', fieldId: 'units', line }) });
                }
            }
            context.response.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
            context.response.write(renderer.renderPackingList({ number: numbers.join(', '), date: '', customer, address: addresses.join('\n\n'), items }));
        } catch (error) {
            log.error({ title: 'Packing list failed', details: error });
            showForm(context.response, customerId, true);
        }
    }
    return { onRequest };
});
