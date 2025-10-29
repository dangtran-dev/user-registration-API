import { Auth } from "@/types/auth";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const instance = axios.create({
    baseURL: `${API_URL}/auth`,
});

export async function register(auth: Auth) {
    try {
        const response = await instance.post("/register", auth);

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
        const response = await instance.post("/login", auth);

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
