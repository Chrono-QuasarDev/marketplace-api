import z from "zod";

export const paramSchema = z.object({
  id: z.uuidv4()
});

export const searchSchema = z.object({
  q: z.string().min(2).max(100).optional(),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(10)
});