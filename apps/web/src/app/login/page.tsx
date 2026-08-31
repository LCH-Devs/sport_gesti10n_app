"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, isStaffRole, LoginResult, saveSession } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<LoginResult>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!isStaffRole(data.role) || !data.admin) {
        throw new Error("Este acceso es solo para la comisión del club.");
      }
      saveSession({
        access_token: data.access_token,
        role: data.role,
        cuentas: data.cuentas,
        must_complete_onboarding: data.must_complete_onboarding,
        must_change_password: data.must_change_password,
        impersonated_by_platform: data.impersonated_by_platform,
        admin: data.admin,
        club: data.club,
      });
      window.dispatchEvent(new Event("club-session-changed"));
      const next = data.must_complete_onboarding
        ? "/gestion/onboarding"
        : data.must_change_password
          ? "/gestion/cambiar-clave"
          : "/dashboard";
      router.push(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("messages.errorCreating"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <span className="text-lg font-bold text-slate-900">AthlletiCorp</span>
      </Link>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
      >
        <h1 className="text-center text-2xl font-bold text-slate-900">
          {t("login.title")}
        </h1>

        <label className="mt-8 block text-sm font-medium text-slate-700">
          {t("login.email")}
          <input
            type="email"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          {t("login.password")}
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-16 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? t("login.hide") : t("login.show")}
            </button>
          </div>
        </label>

        <div className="mt-3 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {t("login.rememberMe")}
          </label>
          <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
            {t("login.forgotPassword")}
          </a>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? t("login.signing") : t("login.signin")}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("login.noAccount")}{" "}
          <Link
            href="/"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            {t("login.backToHome")}
          </Link>
        </p>
      </form>
    </main>
  );
}

/* ------------------------------------------------------------------
 * Diseño anterior (paso previo de slug del club) — comentado a pedido.
 * ------------------------------------------------------------------
 *
 * 'use client';
 *
 * import { FormEvent, useState } from 'react';
 * import { useRouter } from 'next/navigation';
 *
 * export default function ClubEntryPage() {
 *   const router = useRouter();
 *   const [slug, setSlug] = useState('');
 *
 *   function onSubmit(e: FormEvent) {
 *     e.preventDefault();
 *     const clean = slug.trim().toLowerCase();
 *     if (!clean) return;
 *     router.push('/login');
 *   }
 *
 *   return (
 *     <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
 *       <form
 *         onSubmit={onSubmit}
 *         className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
 *       >
 *         <p className="text-sm font-medium text-slate-500">ClubApp Arg</p>
 *         <h1 className="mt-1 text-2xl font-bold text-slate-900">
 *           Ingreso al club
 *         </h1>
 *         <p className="mt-2 text-sm text-slate-600">
 *           Cada club tiene su propio link. Si te lo enviamos por mail, usalo
 *           directo. Si no, ingresá el nombre corto (slug) de tu club.
 *         </p>
 *         <label className="mt-6 block text-sm font-medium text-slate-700">
 *           Slug del club
 *           <input
 *             className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
 *             value={slug}
 *             onChange={(e) => setSlug(e.target.value)}
 *             placeholder="ej. club-prueba"
 *             required
 *           />
 *         </label>
 *         <button
 *           type="submit"
 *           className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white"
 *         >
 *           Ir al login del club
 *         </button>
 *       </form>
 *     </main>
 *   );
 * }
 */
