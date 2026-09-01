"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/lib/useTranslation";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

export function ContactForm() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
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
      setError(
        err instanceof Error ? err.message : t("landing.contactError"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        {t("landing.contactSuccess")}
      </p>
    );
  }

  return (
    <form className="grid gap-3 text-left" onSubmit={onSubmit}>
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
  );
}

export function ContactSection() {
  const { t } = useTranslation();
  return (
    <section
      id="contacto"
      className="mx-auto max-w-xl px-6 py-20 text-center"
    >
      <h2 className="mb-4 text-3xl font-bold text-slate-900">
        {t("landing.contactTitle")}
      </h2>
      <p className="mb-8 text-slate-600">{t("landing.contactSubtitle")}</p>
      <ContactForm />
      <p className="mt-4 text-sm text-slate-500">{t("landing.contactHint")}</p>
    </section>
  );
}
