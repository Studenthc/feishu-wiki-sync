import dotenv from "dotenv";
import Stripe from "stripe";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.development" });

interface LegacyOrderRow {
  id: number;
  order_no: string;
  user_uuid: string;
  user_email: string;
  amount: number;
  interval: string | null;
  credits: number;
  currency: string | null;
  product_id: string | null;
  product_name: string | null;
  valid_months: number | null;
  stripe_session_id: string | null;
  paid_detail: string | null;
  paid_email: string | null;
  paid_at: Date | null;
  sub_id: string | null;
}

function usage() {
  console.log(
    [
      "Usage:",
      "  pnpm exec tsx scripts/backfill-subscriptions.ts [--apply] [--repair-periods] [--limit=N]",
      "",
      "Options:",
      "  --apply     Persist updates to database and Stripe metadata",
      "  --repair-periods   Clear suspicious legacy sub_period_* values",
      "  --limit=N   Process at most N legacy orders",
      "",
      "Default mode is dry-run.",
    ].join("\n")
  );
}

function getArgValue(name: string): string | undefined {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) {
    return direct.split("=")[1];
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function parsePaidDetailSubscriptionId(paidDetail: string | null): string {
  if (!paidDetail) {
    return "";
  }

  try {
    const parsed = JSON.parse(paidDetail) as {
      subscription?: string;
    };
    return parsed.subscription || "";
  } catch {
    return "";
  }
}

function derivePeriodConfig(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const recurring = item?.price?.recurring;
  const interval = recurring?.interval || "month";
  const intervalCount = recurring?.interval_count || 1;
  const validMonths =
    interval === "year" ? intervalCount * 12 : intervalCount;
  const periodStart = subscription.current_period_start || 0;
  const periodEnd = subscription.current_period_end || 0;
  const cycleAnchor = subscription.billing_cycle_anchor || periodStart;

  return {
    interval,
    intervalCount,
    validMonths,
    periodStart,
    periodEnd,
    cycleAnchor,
  };
}

async function resolveSubscriptionId(
  stripe: Stripe,
  order: LegacyOrderRow
): Promise<string> {
  const fromPaidDetail = parsePaidDetailSubscriptionId(order.paid_detail);
  if (fromPaidDetail) {
    return fromPaidDetail;
  }

  if (!order.stripe_session_id) {
    return "";
  }

  const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
  if (!session.subscription) {
    return "";
  }

  return typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    process.exit(0);
  }

  const apply = process.argv.includes("--apply");
  const repairPeriods = process.argv.includes("--repair-periods");
  const limitValue = getArgValue("--limit");
  const limit = limitValue ? Number.parseInt(limitValue, 10) : 100;

  const stripeKey = process.env.STRIPE_PRIVATE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!stripeKey || !databaseUrl) {
    throw new Error("STRIPE_PRIVATE_KEY or DATABASE_URL is missing");
  }

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const sql = postgres(databaseUrl, {
    ssl: "require",
    prepare: false,
  });

  const rows = await sql<LegacyOrderRow[]>`
    select
      id,
      order_no,
      user_uuid,
      user_email,
      amount,
      interval,
      credits,
      currency,
      product_id,
      product_name,
      valid_months,
      stripe_session_id,
      paid_detail,
      paid_email,
      paid_at,
      sub_id
    from orders
    where status = 'paid'
      and interval in ('month', 'year')
      and (sub_id is null or sub_id = '')
    order by created_at asc
    limit ${limit}
  `;

  console.log(
    `[backfill-subscriptions] mode=${apply ? "apply" : "dry-run"} candidates=${rows.length}`
  );

  if (repairPeriods) {
    const repaired = await sql<LegacyOrderRow[]>`
      select
        id,
        order_no,
        user_uuid,
        user_email,
        amount,
        interval,
        credits,
        currency,
        product_id,
        product_name,
        valid_months,
        stripe_session_id,
        paid_detail,
        paid_email,
        paid_at,
        sub_id
      from orders
      where status = 'paid'
        and interval in ('month', 'year')
        and sub_id is not null
        and order_no not like 'in\\_%' escape '\\'
        and sub_period_end is not null
        and expired_at is not null
        and abs(sub_period_end - cast(extract(epoch from expired_at - interval '24 hour') as integer)) > 60
      order by created_at asc
    `;

    console.log(
      `[backfill-subscriptions] suspicious-period-orders=${repaired.length}`
    );

    for (const order of repaired) {
      console.log(
        JSON.stringify(
          {
            repair_order_no: order.order_no,
            user_email: order.user_email,
            sub_id: order.sub_id,
          },
          null,
          2
        )
      );

      if (!apply) {
        continue;
      }

      await sql`
        update orders
        set
          sub_period_start = null,
          sub_period_end = null
        where id = ${order.id}
      `;
    }
  }

  for (const order of rows) {
    try {
      const subscriptionId = await resolveSubscriptionId(stripe, order);
      if (!subscriptionId) {
        console.log(
          `[skip] order=${order.order_no} reason=no_subscription_id`
        );
        continue;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const {
        interval,
        intervalCount,
        validMonths,
        periodStart,
        periodEnd,
        cycleAnchor,
      } = derivePeriodConfig(subscription);

      const metadata = subscription.metadata || {};
      const nextMetadata = {
        ...metadata,
        user_uuid: metadata.user_uuid || order.user_uuid,
        user_email: metadata.user_email || order.user_email,
        credits: metadata.credits || String(order.credits),
        product_id: metadata.product_id || order.product_id || "",
        product_name: metadata.product_name || order.product_name || "",
        currency: metadata.currency || order.currency || "usd",
        interval: metadata.interval || order.interval || interval,
        valid_months:
          metadata.valid_months || String(order.valid_months || validMonths),
      };

      console.log(
        JSON.stringify(
          {
            order_no: order.order_no,
            subscription_id: subscriptionId,
            user_email: order.user_email,
            product_id: order.product_id,
            period_start: periodStart,
            period_end: periodEnd,
            metadata_backfill: nextMetadata,
          },
          null,
          2
        )
      );

      if (!apply) {
        continue;
      }

      await sql`
        update orders
        set
          sub_id = ${subscriptionId},
          sub_interval_count = ${intervalCount},
          sub_cycle_anchor = ${cycleAnchor},
          paid_email = coalesce(paid_email, ${order.user_email}),
          paid_detail = coalesce(paid_detail, ${JSON.stringify({ subscription: subscriptionId })})
        where id = ${order.id}
      `;

      await stripe.subscriptions.update(subscriptionId, {
        metadata: nextMetadata,
      });
    } catch (error) {
      console.error(
        `[error] order=${order.order_no} message=${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
