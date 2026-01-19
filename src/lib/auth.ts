import { currentUser, auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { User } from "@/app/generated/prisma/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { STARTING_BONUS_CREDITS } from "@/features/payment/config/credits-config";

// Create a separate limiter for signups: 2 attempts per 24 hours per IP
const signupLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(2, "24 h"),
    analytics: true,
    prefix: "@upstash/signup",
});

/**
 * Returns the current userId or throws an error.
 * Use this for protected actions that need only the ID.
 */
export async function requireUser(): Promise<string> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return userId;
}

/**
 * Retrieves the current authenticated user from the database.
 * If the user exists in Clerk but not in Prisma, it creates them.
 * Throws an error if the user is not authenticated.
 */
export async function getCurrentUser(): Promise<User> {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("Unauthorized: No user found.");
    }

    // Check if user exists in DB
    const dbUser = await prisma.user.findUnique({
        where: {
            id: clerkUser.id,
        },
    });

    if (dbUser) {
        return dbUser;
    }

    // Lazy creation
    console.log(`Creating new user for ${clerkUser.id}`);

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

    // Invisible Shield: Check for trial abuse via IP
    const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await signupLimiter.limit(ip);

    // Grant bonus only if rate limit passed
    const startingBonus = success ? STARTING_BONUS_CREDITS : 0;

    console.log("Signup Limit Check", {
        userId: clerkUser.id,
        ip,
        success,
        bonus: startingBonus
    });

    const newUser = await prisma.user.create({
        data: {
            id: clerkUser.id,
            email,
            name: name || "Anonymous Scholar",
            credits: startingBonus,
            trialRedeemed: success,
        },
    });

    return newUser;
}
