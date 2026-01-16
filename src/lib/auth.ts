import { currentUser, auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { User } from "@/app/generated/prisma/client";

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

    const newUser = await prisma.user.create({
        data: {
            id: clerkUser.id,
            email,
            name: name || "Anonymous Scholar",
        },
    });

    return newUser;
}
