import { EthereumNetworkSchema } from "@/server/trpc/api/crypto/ethereum/constants";
import { ExchangeSchema } from "@/server/trpc/api/crypto/exchange/types";
import { z } from "zod";

const Common = z.object({
  dashboardSlug: z.string(),
  xOrder: z.number().optional(),
  xOrderPreference: z.enum(["first", "last"]).optional(),
  variant: z.string().optional(),
});

export const CreateCardInputSchema = z.discriminatedUnion("cardTypeId", [
  Common.extend({
    cardTypeId: z.literal("banano_balance"),
    values: z.object({
      banano_balance_address: z.object({
        value: z.string(),
        xOrder: z.number().default(0).optional(),
      }),
      banano_balance_is_owner: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("banano_total"),
    values: z.object({}),
  }),
  Common.extend({
    cardTypeId: z.literal("calculator"),
    values: z.array(
      z.object({
        calculator_currency_id: z.object({
          value: z.string(),
          xOrder: z.number().default(0),
        }),
      })
    ),
  }),
  Common.extend({
    cardTypeId: z.literal("crypto_asset"),
    values: z.object({
      crypto_asset_coin_id: z.object({
        value: z.string(),
        xOrder: z.number().default(0).optional(),
      }),
      crypto_asset_bought_at_timestamp: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
      crypto_asset_buy_price_usd: z.object({
        value: z.string(),
        xOrder: z.number().default(2).optional(),
      }),
      crypto_asset_buy_amount: z.object({
        value: z.string(),
        xOrder: z.number().default(3).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("crypto_order_book"),
    values: z.object({
      crypto_order_book_exchange: z.object({
        value: ExchangeSchema,
        xOrder: z.number().default(0).optional(),
      }),
      crypto_order_book_pair: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("crypto_price"),
    values: z.object({
      crypto_price_coin_id: z.object({
        value: z.string(),
        xOrder: z.number().default(0).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("crypto_price_chart"),
    values: z.object({
      crypto_price_chart_exchange: z.object({
        value: ExchangeSchema,
        xOrder: z.number().default(0).optional(),
      }),
      crypto_price_chart_pair: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("crypto_table"),
    values: z.object({}),
  }),
  Common.extend({
    cardTypeId: z.literal("currency"),
    values: z.object({
      currency_currency_id_base: z.object({
        value: z.string(),
        xOrder: z.number().default(0).optional(),
      }),
      currency_currency_id_quote: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("fear_greed_index"),
    values: z.object({}),
  }),
  Common.extend({
    cardTypeId: z.literal("gas_tracker"),
    values: z.object({
      gas_tracker_network: z.object({
        value: EthereumNetworkSchema,
        xOrder: z.number().default(0).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("nano_balance"),
    values: z.object({
      nano_balance_address: z.object({
        value: z.string(),
        xOrder: z.number().default(0).optional(),
      }),
      nano_balance_is_owner: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("uniswap_pools_table"),
    values: z.object({}),
  }),
  Common.extend({
    cardTypeId: z.literal("uniswap_position"),
    values: z.object({
      uniswap_position_network: z.object({
        value: EthereumNetworkSchema,
        xOrder: z.number().default(0).optional(),
      }),
      uniswap_position_position_id: z.object({
        value: z.string(),
        xOrder: z.number().default(1).optional(),
      }),
      uniswap_position_is_owner: z.object({
        value: z.string(),
        xOrder: z.number().default(2).optional(),
      }),
    }),
  }),
  Common.extend({
    cardTypeId: z.literal("wban_summary"),
    values: z.object({}),
  }),
]);

export type TCardTypeId = z.infer<typeof CreateCardInputSchema>["cardTypeId"];

export type TInferCardValues<T extends TCardTypeId> = Extract<
  z.infer<typeof CreateCardInputSchema>,
  { cardTypeId: T }
>["values"];

export const RenameDashboardSchemaUI = z.object({
  title: z
    .string()
    .min(2, {
      message: "Name should be at least 2 characters.",
    })
    .max(32, {
      message: "Name should be at most 32 characters.",
    }),
});

export const CreateDashboardSchemaUI = z.object({
  title: z
    .string()
    .min(2, {
      message: "Name should be at least 2 characters.",
    })
    .max(32, {
      message: "Name should be at most 32 characters.",
    }),
});

export const ChangeUsernameSchemaUI = z.object({
  newUsername: z
    .string()
    .min(3, {
      message: "Username should be at least 3 characters.",
    })
    .max(20, {
      message: "Username should be at most 20 characters.",
    })
    .regex(/^[a-z0-9_]+$/, {
      message:
        "Username can only contain lowercase letters, numbers, and underscores.",
    }),
});

export const ChangeCurrencyPreferenceSchemaUI = z.object({
  primaryCurrencyId: z.string().uuid(),
  secondaryCurrencyId: z.string().uuid(),
  tertiaryCurrencyId: z.string().uuid(),
});
