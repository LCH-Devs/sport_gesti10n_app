# Sistema de Internacionalización (i18n)

La app soporta **Español (ES)** e **Inglés (EN)** con un sistema simple de traducción.

## 📁 Archivos de Traducción

```
src/lib/translations/
├── es.json    (Español)
└── en.json    (Inglés)
```

## 🚀 Cómo Usar en Componentes

### 1. Importar el hook

```typescript
'use client';

import { useTranslation } from '@/lib/useTranslation';

export function MiComponente() {
  const { t, lang, setLanguage } = useTranslation();
  
  return <div>{t('dashboard.title')}</div>;
}
```

### 2. Sintaxis de Claves

Las claves usan notación de puntos:
- `common.loading` → "Cargando..." (ES) o "Loading..." (EN)
- `dashboard.title` → "Panel de Control" (ES) o "Dashboard" (EN)
- `admin.socios.dni` → "DNI" (ES) o "ID Number" (EN)

### 3. Cambiar Idioma

```typescript
const { setLanguage } = useTranslation();

// Cambiar a Inglés
setLanguage('en');

// Cambiar a Español
setLanguage('es');
```

## 🔧 Agregar Nuevas Traducciones

1. **Abre ambos archivos JSON:**
   - `src/lib/translations/es.json`
   - `src/lib/translations/en.json`

2. **Agrega la nueva clave en ambos idiomas:**

```json
// es.json
{
  "miSeccion": {
    "miClave": "Mi texto en español"
  }
}

// en.json
{
  "miSeccion": {
    "miClave": "My text in English"
  }
}
```

3. **Usa en el componente:**

```typescript
const { t } = useTranslation();
return <h1>{t('miSeccion.miClave')}</h1>;
```

## 📱 Selector de Idioma

Importa el componente `LanguageSwitcher`:

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## 💾 Almacenamiento

El idioma se guarda en `localStorage` con la clave `lang`.
- Por defecto: `es` (Español)
- Se persiste entre recargas de página

## ✅ Checklist para Traducir la App

- [ ] Landing page (`/landing`) - ✅ Hecho
- [ ] Dashboard (`/dashboard`) - Pendiente
- [ ] Login (`/login`) - Pendiente
- [ ] Admin Panel (`/admin/*`) - Pendiente
- [ ] Componentes comunes - Pendiente
- [ ] Navbar y Sidebar - Pendiente

## 📚 Estructura de Traducciones

```json
{
  "common": { ... },      // Elementos comunes (botones, etc)
  "nav": { ... },         // Navegación
  "landing": { ... },     // Landing page
  "login": { ... },       // Login
  "dashboard": { ... },   // Dashboard
  "admin": {              // Panel Admin
    "socios": { ... },
    "espacios": { ... },
    "actividades": { ... },
    ...
  },
  "messages": { ... }     // Mensajes de error/éxito
}
```

## 🎯 Próximos Pasos

Para terminar de traducir toda la app:

1. Actualizar componentes del admin (`/admin/*`)
2. Traducir login page
3. Traducir componentes comunes (Header, Sidebar, etc)
4. Asegurar que todos los textos usen `t()` en lugar de strings hardcodeados
