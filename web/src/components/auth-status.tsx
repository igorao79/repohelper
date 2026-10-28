"use client";

import { usePathname } from "next/navigation";

import { useAppStore } from "@/stores/app-store-provider";

/** Вход через GitHub в хедере: «Войти» или аватар с «Выйти». */
export function AuthStatus() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const configured = useAppStore((s) => s.authConfigured);
  const logout = useAppStore((s) => s.logout);

  if (user === undefined || (!user && !configured)) return null;

  if (!user) {
    return (
      <a className="auth" href={`/api/auth/github?next=${encodeURIComponent(pathname)}`}>
        Войти
      </a>
    );
  }

  return (
    <span className="auth auth--in">
      {/* eslint-disable-next-line @next/next/no-img-element -- аватар GitHub */}
      <img className="auth__avatar" src={user.avatar || `https://github.com/${user.login}.png?size=56`} alt="" width={28} height={28} />
      <span className="auth__login">{user.login}</span>
      <button type="button" className="auth__out" onClick={() => void logout()}>
        Выйти
      </button>
    </span>
  );
}
