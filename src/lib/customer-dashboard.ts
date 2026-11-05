import { z } from "zod";

export const customerAppearance = { title: "Seu Clube", brandHex: "#16794c" };

const decimalSchema = z
  .union([z.number(), z.string().regex(/^\d+(?:\.\d+)?$/)])
  .transform((value) => Number(value))
  .pipe(z.number().finite().nonnegative());

export const b2cCustomerSchema = z.object({
  id: z.string().min(1),
  phone: z.string().min(1),
  name: z.string().trim().min(1),
});

export const b2cMissionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  goalType: z.enum(["VISITS", "AMOUNT"]),
  targetValue: decimalSchema.pipe(z.number().positive()),
  currentProgress: decimalSchema,
  remaining: decimalSchema,
  isCompleted: z.boolean(),
  reward: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
});

export const b2cDashboardSchema = z.object({
  customer: b2cCustomerSchema,
  pointsBalance: z.number().finite().nonnegative(),
  missions: z.array(b2cMissionSchema),
});

export type B2CCustomer = z.infer<typeof b2cCustomerSchema>;
export type CustomerMission = z.infer<typeof b2cMissionSchema>;
export type B2CDashboard = z.infer<typeof b2cDashboardSchema>;

export const customerPointsFormatter = new Intl.NumberFormat("pt-BR");
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCustomerMissionProgress(
  mission: CustomerMission,
): string {
  return mission.goalType === "VISITS"
    ? `Visitas: ${customerPointsFormatter.format(mission.currentProgress)}/${customerPointsFormatter.format(mission.targetValue)}`
    : `Gasto: ${money.format(mission.currentProgress)} / ${money.format(mission.targetValue)}`;
}

export function formatCustomerMissionRemaining(
  mission: CustomerMission,
): string {
  if (mission.isCompleted) return "Objetivo alcançado. Você merece esse mimo!";
  return mission.goalType === "VISITS"
    ? `${mission.remaining === 1 ? "Falta" : "Faltam"} ${customerPointsFormatter.format(mission.remaining)} ${mission.remaining === 1 ? "visita" : "visitas"} para completar.`
    : `Faltam ${money.format(mission.remaining)} em compras para completar.`;
}

export function formatCustomerIdentification(phone: string): string {
  return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}
