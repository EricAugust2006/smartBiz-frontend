export const b2cDashboardResponse = {
  customer: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    phone: "(11) 99999-0000",
    name: "João Silva",
  },
  pointsBalance: 125,
  missions: [
    {
      id: "m1-uuid",
      name: "Fã de Carteirinha",
      goalType: "VISITS",
      targetValue: 3,
      currentProgress: 1,
      remaining: 2,
      isCompleted: false,
      reward: "Um café especial",
      expiresAt: null,
    },
    {
      id: "m2-uuid",
      name: "Cliente Ouro",
      goalType: "AMOUNT",
      targetValue: "150.00",
      currentProgress: "49.90",
      remaining: "100.10",
      isCompleted: false,
      reward: "Uma fatia de bolo",
      expiresAt: "2026-12-31T23:59:59Z",
    },
  ],
};
