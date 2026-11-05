import { z } from "zod";

export const goalTypeSchema = z.enum(["VISITS", "AMOUNT"]);
export const missionStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const missionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  goalType: goalTypeSchema,
  // Decimal database columns may be serialized as strings in JSON.
  targetValue: z
    .union([z.number(), z.string().regex(/^\d+(?:\.\d+)?$/)])
    .transform((value) => Number(value))
    .pipe(z.number().finite().positive()),
  reward: z.string().min(1),
  status: missionStatusSchema,
  expiresAt: z
    .string()
    .refine((date) => Number.isFinite(Date.parse(date)))
    .nullable(),
});

export const missionListSchema = z.array(missionSchema);
export type Mission = z.infer<typeof missionSchema>;
export type MissionStatus = z.infer<typeof missionStatusSchema>;

export const missionFormSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da missão."),
    goalType: goalTypeSchema,
    targetValue: z.string().trim().min(1, "Informe o objetivo da missão."),
    reward: z.string().trim().min(1, "Informe a recompensa da missão."),
  })
  .superRefine((values, context) => {
    if (!values.targetValue) return;
    const normalized = values.targetValue.replace(",", ".");
    const target = Number(normalized);
    const addError = (message: string) =>
      context.addIssue({ code: "custom", path: ["targetValue"], message });

    if (!/^\d+(?:\.\d+)?$/.test(normalized) || !Number.isFinite(target)) {
      addError("Informe um número válido para o objetivo.");
    } else if (values.goalType === "VISITS") {
      if (!Number.isSafeInteger(target) || target < 1) {
        addError("Para visitas, informe um número inteiro de pelo menos 1.");
      }
    } else if (target < 0.01) {
      addError("Para valor gasto, informe pelo menos R$ 0,01.");
    } else if ((normalized.split(".")[1]?.length ?? 0) > 2) {
      addError("Use no máximo duas casas decimais para o valor gasto.");
    } else if (!Number.isSafeInteger(Math.round(target * 100))) {
      addError("O valor informado é muito alto.");
    }
  })
  .transform((values) => ({
    name: values.name,
    goalType: values.goalType,
    targetValue: Number(values.targetValue.replace(",", ".")),
    reward: values.reward,
    expiresAt: null,
  }));

export type MissionFormInput = z.input<typeof missionFormSchema>;
export type CreateMissionInput = z.output<typeof missionFormSchema>;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const integer = new Intl.NumberFormat("pt-BR");
const date = new Intl.DateTimeFormat("pt-BR");

export function formatMissionGoal(
  mission: Pick<Mission, "goalType" | "targetValue">,
): string {
  return mission.goalType === "VISITS"
    ? `${integer.format(mission.targetValue)} ${mission.targetValue === 1 ? "visita" : "visitas"}`
    : `${money.format(mission.targetValue)} em compras`;
}

export function formatMissionExpiration(expiresAt: string | null): string {
  return expiresAt === null
    ? "Sem expiração"
    : `Expira em ${date.format(new Date(expiresAt))}`;
}
