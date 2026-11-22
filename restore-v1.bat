@echo off
chcp 65001 >nul
title Restaurer Aether v1
cd /d C:\Users\pc\Documents\aether-chat

echo ============================================================
echo   RETOUR AU DESIGN / PERSONA v1
echo ============================================================
echo.

git rev-parse design-v1 >nul 2>&1
if errorlevel 1 (
  echo ERREUR : tag design-v1 introuvable.
  pause
  exit /b 1
)

echo Restauration des fichiers depuis design-v1...
git checkout design-v1 -- index.html styles.css app.js api/chat.js system-prompt.md README.md assets\aether-mark.svg
if errorlevel 1 ( echo ERREUR pendant la restauration. & pause & exit /b 1 )

git add .
git diff --cached --quiet
if errorlevel 1 (
  echo Commit de la restauration...
  git commit -m "restore: Aether v1"
  git push
) else (
  echo Deja en version 1, aucun commit necessaire.
)

echo.
echo Redeploiement sur Vercel...
vercel --prod --yes

echo.
echo TERMINE : version 1 restauree.
pause
