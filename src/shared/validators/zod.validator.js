import z from "zod";

// POST - Sign up validation schema (auth)
export const signUpSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8).max(128)
});

// POST - Login validation (auth)
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128)
});

// PUT - Update profile username (user)
export const updateProfileSchema = z.object({
  username: z.string().min(2).max(100)
});

// POST - Create a product listing (product)
export const createProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(5000),
  price: z.number().positive().multipleOf(0.01),
  category: z.string().min(1).max(50),
  images: z.array(z.string().min(1)).min(1),
  availability: z.boolean()
});

// PUT - Update a product listing (product)
export const updateProductSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(3).max(5000).optional(),
  price: z.number().positive().multipleOf(0.01).optional(),
  category: z.string().min(1).max(50).optional(),
  images: z.array(z.string().min(1)).min(1).optional(),
  availability: z.boolean().optional()
});

// POST - Purchase a product (order)
export const purchaseProductSchema = z.object({
  productId: z.uuidv4()
});

// PATCH - Update an order status (order)
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
});

// POST - Add review to product after purchase (review)
export const addReviewSchema = z.object({
  productId: z.uuidv4(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(2).max(5000).optional()
});

// PUT - Edit review (review)
export const editReviewSchema = z.object({
  product: z.uuidv4().optional(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(2).max(5000).optional()
})