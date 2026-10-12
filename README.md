# NetSuite customer packing list

SuiteScript 2.1 Suitelet for selecting one or more Sales Orders for a customer and printing a combined packing checklist. Runs inside NetSuite; no separate web server or npm dependencies are required.

## Use

1. Open the deployed Suitelet and select a customer.
2. Submit to load that customer's sales orders.
3. Select one or more orders (up to 20), then submit to print the packing list.
4. Check packed items and use **Print packing list** to print or save as PDF.

Lines retain their sales order reference and units. Quantity is the order quantity minus the fulfilled quantity. Closed, fully fulfilled, and nonphysical lines are excluded. Supported line types are inventory, assembly, noninventory, and kit items. Checkboxes are temporary browser state; the Suitelet does not create fulfillments or save packing progress. Each order's shipping address is shown separately; orders with different addresses must be packed separately.

The customer order picker shows up to the newest 4,000 orders visible to the user's role. To change customer on the second screen, clear the order selection, select the new customer, and submit again.

## Deploy in a NetSuite sandbox first

1. Enable Server SuiteScript in the account.
2. Upload both files from `src/FileCabinet/SuiteScripts/PackingList/` to the same File Cabinet folder, for example `SuiteScripts/PackingList`.
3. Create a Suitelet script record using `packing-list.js`.
4. Create a deployment in **Testing** status and set the audience to appropriate internal users/roles.
5. Leave **Available Without Login** disabled. Use the current user's permissions; do not configure an elevated Execute As Role without reviewing access requirements.
6. Open the deployment's internal URL and test with a customer having multiple sales orders, partially fulfilled lines, closed lines, different units, and different shipping addresses. Confirm quantities against the account's fulfillment records and any custom workflows.
7. Once validated in your account, deploy the files to production and release the deployment to the approved internal audience.

No NetSuite account credentials are stored in this repository. Deployment is manual through the File Cabinet and script records. The `src/FileCabinet` layout is compatible with later adoption of an SDF project but this starter does not include SDF account configuration or deployment objects.

## Local development

Use Node.js 20 or newer in the existing checkout; no additional worktree is needed.

```sh
cd /workspace/Packing-List
npm test
npm run check
```

Tests exercise the Suitelet with mocked NetSuite APIs: multi-order rendering, outstanding quantities, filtering, escaping, and customer validation. They do not verify live NetSuite API behavior or role permissions. This environment has not deployed or executed the Suitelet in NetSuite. The account sandbox checks above remain required before production release.
