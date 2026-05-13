import dotenv from "dotenv";
import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { handleRecurringInvoicePaid } from "@/services/order";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.development" });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function findMonthlyPriceId(stripe: Stripe, keyword: string) {
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    type: "recurring",
    expand: ["data.product"],
  });

  const price = prices.data.find((item) => {
    if (item.recurring?.interval !== "month") {
      return false;
    }

    const product =
      typeof item.product === "string" ? null : (item.product as Stripe.Product);
    const haystack = [
      item.nickname || "",
      item.lookup_key || "",
      product?.name || "",
      product?.description || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });

  assert(price, `monthly price not found for keyword=${keyword}`);
  return price.id;
}

function getInvoicePeriod(invoice: Stripe.Invoice) {
  const starts = invoice.lines.data
    .map((line) => line.period?.start || 0)
    .filter((value) => value > 0);
  const ends = invoice.lines.data
    .map((line) => line.period?.end || 0)
    .filter((value) => value > 0);

  return {
    start: starts.length > 0 ? Math.min(...starts) : 0,
    end: ends.length > 0 ? Math.max(...ends) : 0,
  };
}

async function waitForInvoice(
  stripe: Stripe,
  subscriptionId: string,
  billingReason: string,
  excludeInvoiceIds: string[] = [],
  minCreated = 0
) {
  for (let i = 0; i < 20; i += 1) {
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 10,
    });
    const invoice = invoices.data
      .filter(
        (item) =>
          item.billing_reason === billingReason &&
          !excludeInvoiceIds.includes(item.id) &&
          item.created >= minCreated
      )
      .sort((a, b) => b.created - a.created)[0];
    if (invoice) {
      return invoice;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `invoice not found for subscription=${subscriptionId} billing_reason=${billingReason}`
  );
}

async function ensureInvoicePaid(stripe: Stripe, invoice: Stripe.Invoice) {
  let current = invoice;

  if (current.status === "draft") {
    current = await stripe.invoices.finalizeInvoice(current.id);
  }

  if (current.status !== "paid") {
    current = await stripe.invoices.pay(current.id);
  }

  return current;
}

async function main() {
  const stripeKey = process.env.STRIPE_PRIVATE_KEY || "";
  assert(stripeKey, "STRIPE_PRIVATE_KEY is not set");

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const starterPrice = await findMonthlyPriceId(stripe, "starter");
  const proPrice = await findMonthlyPriceId(stripe, "pro");
  const conn = db();

  const legacyUserUuid = crypto.randomUUID();
  const legacyEmail = `codex-legacy-period-${Date.now()}@example.com`;

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: "verify-subscription-renewals",
  });

  const customer = await stripe.customers.create({
    email: legacyEmail,
    test_clock: clock.id,
  });

  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id,
  });

  await stripe.customers.update(customer.id, {
    invoice_settings: {
      default_payment_method: paymentMethod.id,
    },
  });

  const legacySubscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: starterPrice }],
  });

  const basePeriodEnd = legacySubscription.current_period_end || 0;
  const baseExpiredAt = new Date((basePeriodEnd + 24 * 60 * 60) * 1000);
  const baseOrderNo = `legacy-${Date.now()}`;

  await conn.insert(orders).values({
    order_no: baseOrderNo,
    created_at: new Date(),
    user_uuid: legacyUserUuid,
    user_email: legacyEmail,
    amount: 990,
    interval: "month",
    expired_at: baseExpiredAt,
    status: "paid",
    credits: 120,
    currency: "usd",
    product_id: "starter",
    product_name: "Nano Banana Starter",
    valid_months: 1,
    paid_at: new Date(),
    paid_email: legacyEmail,
    paid_detail: JSON.stringify({ subscription: legacySubscription.id }),
  });

  await stripe.testHelpers.testClocks.advance(clock.id, {
    frozen_time: basePeriodEnd + 5,
  });

  const renewalInvoice1 = await waitForInvoice(
    stripe,
    legacySubscription.id,
    "subscription_cycle",
    [],
    basePeriodEnd
  );
  const paidRenewalInvoice1 = await ensureInvoicePaid(stripe, renewalInvoice1);
  const renewalPeriod1 = getInvoicePeriod(paidRenewalInvoice1);
  await handleRecurringInvoicePaid(paidRenewalInvoice1, stripe);

  const [baseOrderAfterBackfill] = await conn
    .select()
    .from(orders)
    .where(eq(orders.order_no, baseOrderNo))
    .limit(1);
  const [renewalOrder1] = await conn
    .select()
    .from(orders)
    .where(eq(orders.order_no, renewalInvoice1.id))
    .limit(1);

  assert(baseOrderAfterBackfill, "legacy base order missing after backfill");
  assert(
    baseOrderAfterBackfill.sub_id === legacySubscription.id,
    "legacy base order sub_id not backfilled"
  );
  assert(
    !baseOrderAfterBackfill.sub_period_start &&
      !baseOrderAfterBackfill.sub_period_end,
    "legacy base order period was incorrectly rewritten"
  );
  assert(renewalOrder1, "renewal order 1 was not inserted");
  assert(
    renewalOrder1.sub_period_start === renewalPeriod1.start &&
      renewalOrder1.sub_period_end === renewalPeriod1.end,
    "renewal order 1 period does not match invoice period"
  );

  await stripe.testHelpers.testClocks.advance(clock.id, {
    frozen_time: renewalPeriod1.end + 5,
  });

  const renewalInvoice2Draft = await waitForInvoice(
    stripe,
    legacySubscription.id,
    "subscription_cycle",
    [paidRenewalInvoice1.id],
    renewalPeriod1.end
  );

  const renewalInvoice2 = await ensureInvoicePaid(stripe, renewalInvoice2Draft);
  const renewalPeriod2 = getInvoicePeriod(renewalInvoice2);
  await handleRecurringInvoicePaid(renewalInvoice2, stripe);
  await handleRecurringInvoicePaid(paidRenewalInvoice1, stripe);

  const paidOrders = await conn
    .select()
    .from(orders)
    .where(and(eq(orders.user_uuid, legacyUserUuid), eq(orders.status, "paid")))
    .orderBy(desc(orders.created_at));

  const renewalOrder2 = paidOrders.find((order) => order.order_no === renewalInvoice2.id);
  assert(renewalOrder2, "renewal order 2 was not inserted");
  assert(
    renewalOrder2.sub_period_start === renewalPeriod2.start &&
      renewalOrder2.sub_period_end === renewalPeriod2.end,
    "renewal order 2 period does not match invoice period"
  );
  assert(
    paidOrders.filter((order) => order.order_no === renewalInvoice1.id).length === 1,
    "replaying invoice 1 created duplicate renewal order"
  );

  const updateUserUuid = crypto.randomUUID();
  const updateEmail = `codex-update-${Date.now()}@example.com`;
  const updateCustomer = await stripe.customers.create({
    email: updateEmail,
    test_clock: clock.id,
  });

  const updatePaymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(updatePaymentMethod.id, {
    customer: updateCustomer.id,
  });

  await stripe.customers.update(updateCustomer.id, {
    invoice_settings: {
      default_payment_method: updatePaymentMethod.id,
    },
  });

  const updateSubscription = await stripe.subscriptions.create({
    customer: updateCustomer.id,
    items: [{ price: starterPrice }],
    metadata: {
      user_uuid: updateUserUuid,
      user_email: updateEmail,
      credits: "120",
      product_id: "starter",
      product_name: "Nano Banana Starter",
      interval: "month",
      valid_months: "1",
    },
  });

  await stripe.subscriptions.update(updateSubscription.id, {
    items: [
      {
        id: updateSubscription.items.data[0].id,
        price: proPrice,
      },
    ],
    proration_behavior: "always_invoice",
  });

  const prorationInvoice = await waitForInvoice(
    stripe,
    updateSubscription.id,
    "subscription_update"
  );
  const paidProrationInvoice = await ensureInvoicePaid(stripe, prorationInvoice);
  const beforeUpdateOrders = await conn
    .select()
    .from(orders)
    .where(eq(orders.user_uuid, updateUserUuid));
  const updateResult = await handleRecurringInvoicePaid(
    paidProrationInvoice,
    stripe
  );
  const afterUpdateOrders = await conn
    .select()
    .from(orders)
    .where(eq(orders.user_uuid, updateUserUuid));

  assert(updateResult === null, "subscription_update invoice should be ignored");
  assert(
    afterUpdateOrders.length === beforeUpdateOrders.length,
    "subscription_update invoice should not insert renewal order"
  );

  const zeroUserUuid = crypto.randomUUID();
  const zeroEmail = `codex-zero-${Date.now()}@example.com`;
  const zeroCustomer = await stripe.customers.create({
    email: zeroEmail,
    test_clock: clock.id,
  });

  const zeroPaymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(zeroPaymentMethod.id, {
    customer: zeroCustomer.id,
  });

  await stripe.customers.update(zeroCustomer.id, {
    invoice_settings: {
      default_payment_method: zeroPaymentMethod.id,
    },
  });

  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "forever",
    name: "Codex Zero Renewal",
  });

  const zeroSubscription = await stripe.subscriptions.create({
    customer: zeroCustomer.id,
    items: [{ price: starterPrice }],
    discounts: [{ coupon: coupon.id }],
    metadata: {
      user_uuid: zeroUserUuid,
      user_email: zeroEmail,
      credits: "120",
      product_id: "starter",
      product_name: "Nano Banana Starter",
      interval: "month",
      valid_months: "1",
    },
  });

  const zeroBasePeriodEnd = zeroSubscription.current_period_end || 0;
  await stripe.testHelpers.testClocks.advance(clock.id, {
    frozen_time: zeroBasePeriodEnd + 5,
  });

  const zeroInvoiceDraft = await waitForInvoice(
    stripe,
    zeroSubscription.id,
    "subscription_cycle",
    [],
    zeroBasePeriodEnd
  );
  const zeroInvoice = await ensureInvoicePaid(stripe, zeroInvoiceDraft);
  const zeroPeriod = getInvoicePeriod(zeroInvoice);
  const zeroResult = await handleRecurringInvoicePaid(zeroInvoice, stripe);
  const [zeroOrder] = await conn
    .select()
    .from(orders)
    .where(eq(orders.order_no, zeroInvoice.id))
    .limit(1);

  assert(zeroResult, "zero-amount renewal should create an order");
  assert(zeroOrder, "zero-amount renewal order missing");
  assert(zeroOrder.amount === 0, "zero-amount renewal should preserve amount=0");
  assert(
    zeroOrder.sub_period_start === zeroPeriod.start &&
      zeroOrder.sub_period_end === zeroPeriod.end,
    "zero-amount renewal period does not match invoice period"
  );

  console.log(
    JSON.stringify(
      {
        legacy: {
          base_order_no: baseOrderNo,
          renewal_invoice_1: paidRenewalInvoice1.id,
          renewal_invoice_2: renewalInvoice2.id,
        },
        subscription_update: {
          subscription_id: updateSubscription.id,
          invoice_id: paidProrationInvoice.id,
        },
        zero_amount: {
          subscription_id: zeroSubscription.id,
          invoice_id: zeroInvoice.id,
          amount: zeroOrder.amount,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
