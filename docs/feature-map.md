# Hortis Feature-Map (OSS-Quellen)

| Feature | HortusFox | OlsGrow | Plant-it | Gardener | Beet Anything | Kamerplanter | Hortis |
|---------|-----------|---------|----------|----------|---------------|--------------|--------|
| Standorte / Locations | ja | ja | teilweise | ja | Beete | ja | ja |
| Zimmerpflanzen-CRUD | ja | ja | ja | nein | nein | ja | ja |
| Pflege-Events / Historie | ja | ja | ja | Journal | nein | ja | ja |
| Reminder / Overdue | ja | ja | ja | Tasks | nein | adaptiv | ja |
| Regen-aware Gießen | nein | ja | nein | Wetter | nein | Sensoren | ja |
| QR-Codes | ja | ja | nein | nein | nein | nein | ja |
| Inventar / Einkauf | ja | ja | nein | Expenses | nein | ja | ja |
| Multi-User | ja | ja | nein | Sync | nein | RBAC | ja |
| Beet-Planer | nein | Crop plan | nein | ja | ja | ja | ja |
| Fruchtfolge | nein | nein | nein | ja | ja | ja | ja |
| Mischkultur | nein | nein | nein | ja | ja | Companion graph | ja |
| Saatgut-Inventar | nein | nein | nein | ja | Wishlist | ja | ja |
| Ernte / Karenz | nein | nein | nein | Harvest | nein | IPM Karenz | ja (Karenz) |
| Bonsai-Domain | nein | nein | nein | nein | nein | nein | ja |
| Self-host Web | ja | ja | früher | PWA | PWA | ja | ja |
| Android APK | nein | Capacitor | Flutter | Capacitor | nein | native companion | Capacitor |
| Chat | ja | Diary | nein | nein | nein | LLM RAG | später |
| Home Assistant | nein | REST hooks | nein | nein | nein | ja | API-Hooks später |

## Port-Strategie

- **Runtime:** TypeScript Monorepo (nicht PHP/Flutter/ArangoDB).
- **Algorithmen:** `packages/care-engine`, `packages/garden-engine`, `packages/bonsai-engine`.
- **Vendor:** Referenzklone unter `vendor/` für Nachvollziehbarkeit und Lizenzattribution.
