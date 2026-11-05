import { isAxiosError } from "axios";
import { z, ZodError } from "zod";

export const authTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: z.string().optional(),
  whatsappNumber: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  role: z
    .string()
    .min(1)
    .refine((role) => role !== "B2C", "Use uma conta de lojista."),
  tenantId: z.string().optional(),
  createdAt: z.string().optional(),
});

export const authResponseSchema = z.object({
  access_token: z.string().trim().min(1),
  user: authUserSchema,
  tenant: authTenantSchema,
});
export const registerResponseSchema = z.object({
  user: authUserSchema,
  tenant: authTenantSchema,
  access_token: z.string().trim().min(1).optional(),
});
export const storedB2BSessionSchema = z.object({
  accessToken: z.string().trim().min(1),
  user: authUserSchema,
  tenant: authTenantSchema,
});

const emailSchema = z
  .string()
  .trim()
  .pipe(z.email("Informe um e-mail válido."));
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});
export const registerFormSchema = loginFormSchema.extend({
  tenantName: z.string().trim().min(1, "Informe o nome do estabelecimento."),
  userName: z.string().trim().min(1, "Informe seu nome."),
  password: z.string().min(8, "Use uma senha com pelo menos 8 caracteres."),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTenant = z.infer<typeof authTenantSchema>;
export type LoginInput = z.infer<typeof loginFormSchema>;
export type RegisterInput = z.infer<typeof registerFormSchema>;

export function getAuthErrorMessage(
  error: unknown,
  mode: "login" | "register",
): string {
  if (error instanceof ZodError)
    return "O servidor retornou uma sessão inválida. Tente novamente.";
  if (isAxiosError<unknown>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403)
      return "Credenciais inválidas. Confira seu e-mail e sua senha.";
    if (error.response?.status === 409)
      return "Já existe uma conta com este e-mail ou estabelecimento.";
    if (error.response?.status === 429)
      return "Muitas tentativas. Aguarde um momento e tente novamente.";
    if (error.response?.status === 400) {
      const body = error.response.data;
      if (typeof body === "object" && body !== null && "message" in body) {
        if (typeof body.message === "string") return body.message;
        if (
          Array.isArray(body.message) &&
          body.message.every((message: unknown) => typeof message === "string")
        )
          return body.message.join(" ");
      }
    }
  }
  return mode === "login"
    ? "Não foi possível entrar. Verifique sua conexão e tente novamente."
    : "Não foi possível criar a conta. Verifique sua conexão e tente novamente.";
}
