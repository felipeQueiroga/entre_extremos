@echo off
title Entre Extremos - Expor via ngrok
cd /d "%~dp0"

where ngrok >nul 2>&1
if errorlevel 1 (
  echo.
  echo  ERRO: ngrok nao encontrado no PATH.
  echo  Instale em https://ngrok.com/download
  pause
  exit /b 1
)

echo.
echo  ========================================
echo    Entre Extremos - Modo online (ngrok)
echo  ========================================
echo.
echo  PASSO 1: Deixe o iniciar.bat rodando em outra janela
echo           (servidor 3001 + cliente 5173)
echo.
echo  PASSO 2: Este script abre o ngrok e configura as URLs
echo.
pause

echo  Abrindo ngrok (cliente 5173 + servidor 3001)...
start "ngrok" cmd /k ngrok start --all --config "%~dp0ngrok.yml"

echo  Aguardando tuneis...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-ngrok-env.ps1"
if errorlevel 1 (
  echo.
  echo  Falha ao ler URLs. Confira http://127.0.0.1:4040
  pause
  exit /b 1
)

echo.
echo  Reiniciando cliente com URL do servidor ngrok...
call :killPort 5173
call :killPort 5174
timeout /t 1 /nobreak >nul

for /f "tokens=1,* delims==" %%a in ('findstr "SERVIDOR=" ngrok-urls.txt') do set VITE_SERVER_URL=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "CLIENTE=" ngrok-urls.txt') do set LINK_NAMORADA=%%b

start "cliente-ngrok" cmd /k "cd /d "%~dp0" && set VITE_SERVER_URL=%VITE_SERVER_URL% && npm run dev -w client"

echo.
echo  ========================================
echo  Envie este link para sua namorada:
echo.
echo    %LINK_NAMORADA%
echo  ========================================
echo.
echo  Voce tambem deve abrir esse link (nao use localhost).
echo  Mantenha abertas: iniciar.bat, ngrok e esta janela.
echo.
pause
exit /b 0

:killPort
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%1 " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p >nul 2>&1
)
exit /b 0
