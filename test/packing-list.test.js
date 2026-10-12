const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, dependencies = []) {
    let module;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/FileCabinet/SuiteScripts/PackingList', file), 'utf8'), {
        define: (_names, factory) => { module = factory(...dependencies); }
    });
    return module;
}
const renderer = load('render.js');
const ui = { FieldType: {}, createForm: () => ({ addField: () => ({ addSelectOption() {} }), addSubmitButton() {} }) };
const search = { Type: {}, Sort: {}, createColumn: x => x, create: () => ({ run: () => ({ each() {} }) }) };
function run(orders, customer = '7', ids = '1\u00052') {
    let html;
    let form = false;
    const suitelet = load('packing-list.js', [ui, {
        Type: { SALES_ORDER: 'salesorder' },
        load: ({ id, type }) => { assert.equal(type, 'salesorder'); return orders[id]; }
    }, search, { error() {} }, renderer]);
    suitelet.onRequest({ request: { parameters: { custpage_customer: customer, custpage_orders: ids } }, response: {
        setHeader() {}, write: value => { html = value; }, writePage: () => { form = true; }
    } });
    return { html, form };
}
function order(number, customer = 7) {
    const lines = [
        { itemtype: 'InvtPart', quantity: 5, quantityshiprecv: 2, description: '<img src=x>' },
        { itemtype: 'InvtPart', quantity: 2, quantityshiprecv: 2 },
        { itemtype: 'InvtPart', quantity: 1, isclosed: true },
        { itemtype: 'Subtotal', quantity: 1 }
    ];
    return {
        getValue: ({ fieldId }) => ({ entity: customer, tranid: number, shipaddress: 'A & B' })[fieldId],
        getText: () => 'Customer', getLineCount: () => lines.length,
        getSublistValue: ({ fieldId, line }) => lines[line][fieldId],
        getSublistText: ({ fieldId, line }) => fieldId === 'units' ? 'Each' : `Widget ${line}`
    };
}
test('combines orders, prints outstanding quantities, and skips closed or non-item lines', () => {
    const { html, form } = run({ 1: order('SO1'), 2: order('SO2') });
    assert.equal(form, false);
    assert.match(html, /SO1, SO2/);
    assert.equal((html.match(/Widget 0<\/td>/g) || []).length, 2);
    assert.match(html, /3 Each/);
    assert.doesNotMatch(html, /Widget [123]/);
    assert.match(html, /&lt;img src=x&gt;/);
    assert.match(html, /A &amp; B/);
    assert.doesNotMatch(html, /<img/);
});
test('rejects another customer’s sales order without printing data', () => {
    const result = run({ 1: order('SO1', 8) }, '7', '1');
    assert.equal(result.form, true);
    assert.equal(result.html, undefined);
});
test('rejects malformed order IDs', () => {
    assert.equal(run({}, '7', '-1').form, true);
});
test('customer selection displays an order-selection form', () => {
    assert.equal(run({}, '7', '').form, true);
});
