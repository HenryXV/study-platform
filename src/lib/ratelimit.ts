import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that will allow 10 requests per 10 minutes
export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis.
     *
     * @default "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit",
});
