# Hortis Feature-Audit vs. Quell-Apps

Stand nach Gap-Lauf gegen HortusFox, OlsGrow, Plant-it, Gardener, Beet Anything, Kamerplanter.

| Feature | HF | OG | PI | GA | BA | KP | Hortis |
|---------|----|----|----|----|----|----|--------|
| Standorte | ✓ | ✓ | ~ | ✓ | Beete | ✓ | ✓ |
| Pflanzen-CRUD + Karten | ✓ | ✓ | ✓ | – | – | ✓ | ✓ |
| Pflege-Events / Historie | ✓ | ✓ | ✓ | Journal | – | ✓ | ✓ |
| Reminder / Overdue / Digest | ✓ | ✓ | ✓ | Tasks | – | adaptiv | ✓ |
| Regen-aware | – | ✓ | – | Wetter | – | Sensor | ✓ |
| Fotos / Galerie | ✓ | ✓ | ✓ | ✓ | – | ✓ | ✓ |
| QR-Codes | ✓ | ✓ | – | – | – | – | ✓ |
| Inventar / Einkauf | ✓ | ✓ | – | Expenses | – | ✓ | ✓ |
| Multi-User / Rollen | ✓ | ✓ | – | Sync | – | RBAC | ✓ |
| Globale Suche | ✓ | ~ | ✓ | ✓ | – | ✓ | ✓ |
| Gruppenchat | ✓ | Diary | – | – | – | RAG | ✓ Chat |
| Kalender (in-app) | ✓ | ✓ | ✓ | ✓ | – | iCal | ✓ + ICS |
| Pflanzen-Historie/Archiv | ✓ | – | – | – | – | ✓ | ✓ |
| Klonen / Bulk-Pflege Standort | ✓ | – | – | – | – | – | ✓ |
| PlantNet-ID | ✓ | ✓ | – | – | – | Pl@ntNet | ✓ (Key) |
| API-Tokens / Hooks | ✓ | REST | – | – | – | HA | ✓ |
| Mail / Telegram / Signal / Push | – | Push | Push | – | – | – | ✓ |
| Beetplan | – | Crop | – | ✓ | ✓ | ✓ | ✓ |
| Fruchtfolge-Warnung | – | – | – | ✓ | ✓ | ✓ | ✓ |
| Mischkultur-Score | – | – | – | ✓ | ✓ | Graph | ✓ |
| Saatgut-Inventar | – | – | – | ✓ | Wishlist | ✓ | ✓ |
| Ernte-Log (Gewicht) | – | – | – | ✓ | – | ✓ | ✓ |
| Karenz nach Pest | – | – | – | – | – | ✓ | ✓ |
| Bonsai-Domain | – | – | – | – | – | – | ✓ |
| Guides / Wissen | – | – | – | – | Pest UI | RAG | ✓ |
| Wetter-Standort UI | OWM | ✓ | – | ✓ | – | – | ✓ Open-Meteo |
| Self-host Web | ✓ | ✓ | früher | PWA | PWA | ✓ | ✓ |
| Android APK | – | Cap | Flutter | Cap | – | native | Capacitor |
| Themes | ✓ | – | – | – | – | Modes | – |
| Livestock | – | – | – | ✓ | – | – | bewusst nicht |
| Nährstoff-EC / GDD voll | – | – | – | – | – | ✓ | – (schlank) |
| HA Custom Integration | – | Hooks | – | – | – | ✓ | Hook-URL |
| Layout-Optimizer AI | – | – | – | Autofill | ✓ | – | Score only |
| Krankheits-ID (Blatt) | – | ✓ | – | – | – | ✓ | via PlantNet |

Legende: HF HortusFox, OG OlsGrow, PI Plant-it, GA Gardener, BA Beet Anything, KP Kamerplanter.

## Bewusst nicht 1:1

- Kamerplanter-Cluster (ArangoDB, Celery, Ollama, Timescale)
- HortusFox-PHP / Themes-Engine
- Gardener-Livestock
- Plant-it Flutter-Client (Capacitor statt dessen)
