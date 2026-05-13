import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  email: z.string().email("Correo invalido"),
  temporaryPassword: z.string().min(8, "Minimo 8 caracteres")
});

export const taskSchema = z.object({
  title: z.string().min(3),
  status: z.enum(["No iniciado", "En progreso", "En revision", "Bloqueado", "Completado"]),
  priority: z.enum(["Alta", "Media", "Baja"])
});

export const fileSchema = z.object({
  name: z.string().min(1),
  sizeMb: z.number().max(250, "El archivo supera 250 MB")
});
