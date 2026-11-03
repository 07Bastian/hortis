# HTTPS Reverse Proxy für Hortis

Produktion: TLS vor der API (`8787`). Default-Secrets in `.env` ändern.

## Caddy

```caddyfile
hortis.example.com {
  reverse_proxy 127.0.0.1:8787
}
```

## nginx

```nginx
server {
  listen 443 ssl http2;
  server_name hortis.example.com;
  ssl_certificate     /etc/ssl/certs/hortis.crt;
  ssl_certificate_key /etc/ssl/private/hortis.key;

  client_max_body_size 12m;

  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## CORS

`HORTIS_CORS_ORIGIN` auf die öffentliche Origin setzen, z. B. `https://hortis.example.com`.
