@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Hortis — Docker Start

cd /d "%~dp0"

set "COMPOSE_PROJECT_NAME=hortis"
set "URL=http://localhost:8787"

echo.
echo  === Hortis (Zimmer / Bonsai / Garten) ===
echo  Docker: %URL%
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Docker nicht gefunden. Docker Desktop starten und erneut versuchen.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Docker Desktop laeuft nicht. Bitte starten, warten bis "Engine running", dann BAT erneut.
  pause
  exit /b 1
)

if not exist "docker-compose.yml" (
  echo [FEHLER] docker-compose.yml fehlt.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    echo [INFO] Erstelle .env aus .env.example ...
    copy /Y ".env.example" ".env" >nul
    echo [HINWEIS] HORTIS_JWT_SECRET und HORTIS_ADMIN_PASSWORD in .env aendern.
  )
)

echo [1/3] Stack bauen und starten...
docker compose -p hortis up -d --build
if errorlevel 1 (
  echo [FEHLER] docker compose ist fehlgeschlagen.
  echo [TIPP] Laeuft schon npm auf Port 8787? Prozess beenden oder HORTIS_PORT in .env aendern.
  pause
  exit /b 1
)

echo [2/3] Status:
docker compose -p hortis ps

echo [3/3] Browser oeffnen: %URL%
start "" "%URL%"

echo.
echo  Fertig. Stoppen: stop-hortis.bat
echo.
pause
endlocal
