import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type TokensStore = {
    accessToken: string | null;
    refreshToken: string | null;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearTokens: () => void;
};

export const useTokensStore = create<TokensStore>()(
    persist(
        (set, get) => ({
            accessToken: null,
            refreshToken: null,
            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken }),
            clearTokens: () => {
                set({ accessToken: null, refreshToken: null });
            },
        }),
        {
            name: "tokens",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
