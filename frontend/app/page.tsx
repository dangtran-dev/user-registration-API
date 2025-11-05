"use client";

import { checkAuth, logout } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { useTokensStore } from "@/stores/use-tokens-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const accessToken = useTokensStore((state) => state.accessToken);
    const clearTokens = useTokensStore((state) => state.clearTokens);

    const router = useRouter();

    const { data: user, isLoading } = useQuery({
        queryFn: () => checkAuth(),
        queryKey: ["user", accessToken],
        enabled: !!accessToken,
        retry: false,
    });

    const { mutateAsync: handleLogout } = useMutation({
        mutationFn: (userId: number) => logout(userId),
        onSuccess: () => {
            clearTokens();
            router.replace("/login");
        },
    });

    useEffect(() => {
        if (!user && !isLoading) {
            router.replace("/login");
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <Image
                    className="dark:invert"
                    src="/next.svg"
                    alt="Next.js logo"
                    width={100}
                    height={20}
                    priority
                />
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                        To get started, edit the page.tsx file.
                    </h1>
                    <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        Looking for a starting point or more instructions? Head
                        over to{" "}
                        <a
                            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                            className="font-medium text-zinc-950 dark:text-zinc-50"
                        >
                            Templates
                        </a>{" "}
                        or the{" "}
                        <a
                            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                            className="font-medium text-zinc-950 dark:text-zinc-50"
                        >
                            Learning
                        </a>{" "}
                        center.
                    </p>
                </div>

                {user && (
                    <Button
                        className="cursor-pointer"
                        onClick={() => handleLogout(user.userId)}
                    >
                        Log out
                    </Button>
                )}
            </main>
        </div>
    );
}
