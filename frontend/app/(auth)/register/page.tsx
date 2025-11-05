"use client";

import { checkAuth, register } from "@/api/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTokensStore } from "@/stores/use-tokens-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const passwordSchema = z
    .string()
    .min(8, { error: "Password must be at least 8 characters long." })
    .refine((val) => /[A-Z]/.test(val), {
        error: "Password must contain at least one uppercase letter.",
    })
    .refine((val) => /[a-z]/.test(val), {
        error: "Password must contain at least one lowercase letter.",
    })
    .refine((val) => /[0-9]/.test(val), {
        error: "Password must contain at least one number.",
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        error: "Password must contain at least one special character.",
    });

const formSchema = z
    .object({
        email: z.email({ pattern: z.regexes.rfc5322Email }),
        password: passwordSchema,
        confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function RegisterPage() {
    const accessToken = useTokensStore((state) => state.accessToken);

    const router = useRouter();

    const { data: user, isLoading } = useQuery({
        queryFn: () => checkAuth(),
        queryKey: ["user", accessToken],
        enabled: !!accessToken,
        retry: false,
    });

    useEffect(() => {
        if (user && !isLoading) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        mode: "all",
    });

    const { mutateAsync: signUp, isPending } = useMutation({
        mutationFn: (data: z.infer<typeof formSchema>) =>
            register({ email: data.email, password: data.password }),
        onSuccess: () => {
            router.push("/login");
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        signUp(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <section className="w-full sm:max-w-md">
                <h1 className="text-3xl text-center font-bold text-gray-900 mb-5">
                    Create user
                </h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Register</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form
                            id="register-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <FieldGroup>
                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="email">
                                                Email
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                type="text"
                                                id="email"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Enter your email"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="password"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="password">
                                                Password
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                type="password"
                                                id="password"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Create a strong password"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="confirmPassword"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="confirmPassword">
                                                Confirm Password
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                type="password"
                                                id="confirmPassword"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Confirm your password"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </form>
                    </CardContent>

                    <CardFooter>
                        <Field orientation="vertical">
                            <Button
                                type="submit"
                                form="register-form"
                                disabled={isPending}
                            >
                                {isPending ? "Creating..." : "Register"}
                            </Button>

                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href={"/login"}
                                    className="hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </Field>
                    </CardFooter>
                </Card>
            </section>
        </div>
    );
}
