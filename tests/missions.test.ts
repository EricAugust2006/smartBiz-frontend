import { describe, expect, it } from "vitest";
import {
  formatMissionExpiration,
  formatMissionGoal,
  missionFormSchema,
  missionListSchema,
} from "@/lib/missions";

const base = {
  name: " Fã de Carteirinha ",
  goalType: "VISITS" as const,
  targetValue: "3",
  reward: " 1 Café e 1 Croissant ",
};

describe("regras das missões", () => {
  it("normaliza o formulário e fixa a validade em null", () => {
    expect(missionFormSchema.parse(base)).toEqual({
      name: "Fã de Carteirinha",
      goalType: "VISITS",
      targetValue: 3,
      reward: "1 Café e 1 Croissant",
      expiresAt: null,
    });
  });

  it.each(["0", "0.5", "3.1", "-1", "1e2", "Infinity", "9007199254740992"])(
    "rejeita objetivo de visitas inválido: %s",
    (targetValue) => {
      expect(
        missionFormSchema.safeParse({ ...base, targetValue }).success,
      ).toBe(false);
    },
  );

  it.each(["0.01", "150", "150.50", "150,50"])(
    "aceita valor gasto em reais: %s",
    (targetValue) => {
      expect(
        missionFormSchema.parse({ ...base, goalType: "AMOUNT", targetValue })
          .targetValue,
      ).toBe(Number(targetValue.replace(",", ".")));
    },
  );

  it.each([
    "0",
    "0.001",
    "150.999",
    "1.230",
    "1e2",
    "-10",
    "999999999999999999",
  ])("rejeita valor gasto inválido: %s", (targetValue) => {
    expect(
      missionFormSchema.safeParse({ ...base, goalType: "AMOUNT", targetValue })
        .success,
    ).toBe(false);
  });

  it("exige nome e recompensa com conteúdo", () => {
    expect(missionFormSchema.safeParse({ ...base, name: "  " }).success).toBe(
      false,
    );
    expect(missionFormSchema.safeParse({ ...base, reward: "  " }).success).toBe(
      false,
    );
  });

  it("exibe objetivos e validade nos cartões", () => {
    expect(formatMissionGoal({ goalType: "VISITS", targetValue: 1 })).toBe(
      "1 visita",
    );
    expect(formatMissionGoal({ goalType: "VISITS", targetValue: 3 })).toBe(
      "3 visitas",
    );
    expect(
      formatMissionGoal({ goalType: "AMOUNT", targetValue: 150.5 }).replace(
        /\s/g,
        " ",
      ),
    ).toBe("R$ 150,50 em compras");
    expect(formatMissionExpiration(null)).toBe("Sem expiração");
  });

  it("valida a lista e aceita Decimal serializado como string", () => {
    expect(
      missionListSchema.parse([
        {
          id: "1",
          name: "Missão",
          goalType: "AMOUNT",
          targetValue: "150.50",
          reward: "Café",
          status: "INACTIVE",
          expiresAt: null,
        },
      ])[0].targetValue,
    ).toBe(150.5);
    expect(missionListSchema.safeParse({ data: [] }).success).toBe(false);
    expect(missionListSchema.safeParse([{ status: "ACTIVE" }]).success).toBe(
      false,
    );
  });
});
