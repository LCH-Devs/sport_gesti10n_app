"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

export function ContactForm() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [contactTab, setContactTab] = useState<"query" | "join">("query");
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    nombre_club: "",
    email: "",
    telefono: "",
    cantidad_miembros: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/solicitudes", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          nombre_club: form.nombre_club.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          cantidad_miembros: Number(form.cantidad_miembros),
        }),
      });
      setSent(true);
      setForm({
        nombre: "",
        apellido: "",
        nombre_club: "",
        email: "",
        telefono: "",
        cantidad_miembros: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("landing.contactError"));
    } finally {
      setSaving(false);
    }
  }

   return (
       <section id="contacto" className="max-w-xl mx-auto px-6 py-20 text-center">
      <div className="mb-8 flex justify-center gap-2 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setContactTab("query")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            contactTab === "query"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("landing.contactTabQuery")}
        </button>
        <button
          type="button"
          onClick={() => setContactTab("join")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            contactTab === "join"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("landing.contactTabJoin")}
        </button>
      </div>
      {contactTab === "query" ? (
        <>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t("landing.contactTitle")}
          </h2>
          <p className="text-slate-600 mb-8">{t("landing.contactSubtitle")}</p>
          <form
            key="query-form"
            className="grid gap-3 text-left"
            action="mailto:hola@clubapp.com.ar"
            method="get"
          >
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactName")}
              <input
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactClub")}
              <input
                name="club"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactEmail")}
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactMessage")}
              <textarea
                name="body"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              {t("landing.contactSend")}
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {t("landing.joinTitle")}
          </h2>
          <p className="text-slate-600 mb-8">{t("landing.joinSubtitle")}</p>
          {sent && (
            <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {t("landing.contactSuccess")}
            </p>
          )}
          <form key="join-form" className="grid gap-3 text-left" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                {t("landing.contactName")}
                <input
                  name="nombre"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {t("landing.contactLastName")}
                <input
                  name="apellido"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.apellido}
                  onChange={(e) => setField("apellido", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactClub")}
              <input
                name="nombre_club"
                required
                minLength={2}
                maxLength={120}
                value={form.nombre_club}
                onChange={(e) => setField("nombre_club", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactEmail")}
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactPhone")}
              <input
                type="tel"
                name="telefono"
                required
                minLength={8}
                maxLength={20}
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {t("landing.contactMembers")}
              <input
                type="number"
                name="cantidad_miembros"
                required
                min={0}
                max={99999}
                value={form.cantidad_miembros}
                onChange={(e) => setField("cantidad_miembros", e.target.value)}
                className={inputClass}
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t("landing.contactSending") : t("landing.contactSend")}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export function ContactSection() {
  const { t } = useTranslation();
 return <ContactForm />
}
