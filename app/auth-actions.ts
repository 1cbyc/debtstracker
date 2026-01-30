"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function signUp(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "All fields are required" };
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { error: "User already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
    });

    return { success: true };
}
