import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 min
  max: 2, // 10 requests per IP
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests from this IP. Please try again 5 minutes later.",
  },

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many requests from this IP. Please try again 5 minutes later.",
    });
  },
});