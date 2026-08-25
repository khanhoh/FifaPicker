@echo off
title FC Online Realtime Draft Picker
echo ==============================================
echo  Starting FC Online Realtime Draft Picker...
echo ==============================================

start cmd /k "cd server && node server.js"
timeout /t 2 >nul
start cmd /k "cd client && npm run dev"

echo.
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo ==============================================
