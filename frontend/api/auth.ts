import instance from "@/lib/interceptor";
import { Auth } from "@/types/auth";
import { User } from "@/types/user";

export async function register(auth: Auth) {
    try {
        const response = await instance.post("/auth/register", auth);

        return response.data;
    } catch (error: any) {
        const message =
            error.response?.data?.message ||
            error.message ||
            "Registration failed.";
        throw new Error(message);
    }
}

export async function login(auth: Auth) {
    try {
        const response = await instance.post("/auth/login", auth);

        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message;

        if (message === "Email not found") {
            throw new Error("This email does not exist.");
        } else if (message === "Incorrect password") {
            throw new Error("Incorrect password. Please try again.");
        } else {
            throw new Error(
                message || "Login failed. Please check your credentials."
            );
        }
    }
}

export async function checkAuth(): Promise<User> {
    try {
        const response = await instance.get("/auth/me");

        return response.data;
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            throw new Error("Access token invalid or expired.");
        } else {
            throw new Error("Unexpected error while checking authentication.");
        }
    }
}

export async function logout(userId: number) {
    try {
        const response = await instance.post("/auth/logout", { userId });
        return response.data;
    } catch (error: any) {
        console.error("Logout failed:", error.response?.data || error.message);
        throw error;
    }
}
