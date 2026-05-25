@echo off
title Entre Extremos - Dev
cd /d "%~dp0"

echo.
echo  Entre Extremos
echo  Verificando portas 3001 e 5173...
echo.

call :killPort 3001
call :killPort 5173
call :killPort 5174

timeout /t 1 /nobreak >nul

echo  Iniciando servidor (3001) e cliente (5173)...
echo.

npm run dev

if errorlevel 1 (
  echo.
  echo  Erro ao iniciar. Verifique se o Node.js esta instalado e rode "npm install".
  pause
)

exit /b 0

:killPort
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%1 " ^| findstr "LISTENING"') do (
  echo  Liberando porta %1 ^(PID %%p^)...
  taskkill /F /PID %%p >nul 2>&1
)
exit /b 0
