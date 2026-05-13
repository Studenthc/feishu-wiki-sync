import dotenv from "dotenv";
import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { credits, orders } from "@/db/schema";
import { handleRecurringInvoicePaid } from "@/services/order";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.development" });

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("usage: pnpm exec tsx scripts/verify-renewal-credit-replay.ts <email>");
  }

  const stripeKey = process.env.STRIPE_PRIVATE_KEY || "";
  if (!stripeKey) {
    throw new Error("STRIPE_PRIVATE_KEY is not set");
  }

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  const conn = db();
  const paidOrders = await conn
    .select()
    .from(orders)
    .where(and(eq(orders.user_email, email), eq(orders.status, "paid")))
    .orderBy(desc(orders.created_at));

  const renewalOrder = paidOrders.find((order) => order.order_no.startsWith("in_"));
  if (!renewalOrder) {
    throw new Error(`no renewal order found for ${email}`);
  }

  const beforeCredit = await conn
    .select()
    .from(credits)
    .where(eq(credits.order_no, renewalOrder.order_no))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        phase: "before-delete",
        order_no: renewalOrder.order_no,
        user_uuid: renewalOrder.user_uuid,
        credits: renewalOrder.credits,
        credit_rows: beforeCredit.length,
      },
      null,
      2
    )
  );

  await conn.delete(credits).where(eq(credits.order_no, renewalOrder.order_no));

  const afterDelete = await conn
    .select()
    .from(credits)
    .where(eq(credits.order_no, renewalOrder.order_no))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        phase: "after-delete",
        order_no: renewalOrder.order_no,
        credit_rows: afterDelete.length,
      },
      null,
      2
    )
  );

  const invoice = await stripe.invoices.retrieve(renewalOrder.order_no);
  await handleRecurringInvoicePaid(invoice, stripe);

  const afterReplay = await conn
    .select()
    .from(credits)
    .where(eq(credits.order_no, renewalOrder.order_no))
    .limit(1);

  console.log(
    JSON.stringify(
      {
        phase: "after-replay",
        order_no: renewalOrder.order_no,
        credit_rows: afterReplay.length,
        credit: afterReplay[0]
          ? {
              user_uuid: afterReplay[0].user_uuid,
              credits: afterReplay[0].credits,
              trans_type: afterReplay[0].trans_type,
            }
          : null,
      },
      null,
      2
    )
  );

  if (afterReplay.length !== 1) {
    throw new Error(`credit replay failed for ${renewalOrder.order_no}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
