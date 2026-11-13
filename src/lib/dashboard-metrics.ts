import { z } from "zod";

const decimalAmountSchema = z.string().regex(/^\d+(?:\.\d{1,2})?$/);

export const dashboardMetricsSchema = z.object({
  totalRevenue: decimalAmountSchema,
  monthlyRevenue: decimalAmountSchema,
  totalCustomers: z.number().int().nonnegative(),
  activeMissions: z.number().int().nonnegative(),
  recentSales: z.array(
    z.object({
      id: z.string().min(1),
      amount: decimalAmountSchema,
      createdAt: z.string().datetime({ offset: true }),
      customer: z
        .object({
          name: z.string(),
          phone: z.string(),
        })
        .nullable(),
    }),
  ),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const dashboardMoneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const dashboardDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
