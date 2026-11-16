@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Hortis — Docker Stop

cd /d "%~dp0"

echo.
echo  === Hortis stoppen ===
docker compose -p hortis down
echo.
pause
endlocal
