import {
  Crown,
  LayoutDashboard,
  MessagesSquare,
  Package,
  ReceiptText,
  Settings,
  Target,
} from "lucide-react";

export const PANEL_NAV = [
  { to: "/painel", label: "Início", icon: LayoutDashboard, end: true },
  {
    to: "/painel/nova-venda",
    label: "Nova Venda",
    icon: ReceiptText,
    end: false,
  },
  {
    to: "/painel/copiloto",
    label: "Copiloto",
    icon: MessagesSquare,
    end: false,
  },
  { to: "/painel/estoque", label: "Estoque e Produtos", icon: Package, end: false },
  { to: "/painel/clube-vip", label: "Clube VIP", icon: Crown, end: false },
  {
    to: "/painel/missoes",
    label: "Missões e Desafios",
    icon: Target,
    end: false,
  },
  {
    to: "/painel/configuracoes",
    label: "Configurações",
    icon: Settings,
    end: false,
  },
];
