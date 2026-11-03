# Hortis auf Kubernetes (optional)

Kamerplanters voller Stack (ArangoDB, Celery, pgvector, Ollama, Timescale) wird **nicht** übernommen.
Hortis bleibt eine SQLite-App. Die Manifeste unter `deploy/k8s/` deployen nur Hortis.

```bash
docker build -t hortis:latest .
kubectl apply -f deploy/k8s/deployment.yaml
kubectl -n hortis port-forward svc/hortis 8787:80
```

GDD/EC laufen in-process gegen Open-Meteo — kein TimescaleDB nötig.
