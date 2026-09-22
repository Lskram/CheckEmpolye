@echo off
title Push Attendance PWA to GitHub
echo ==============================================
echo  Uploading Attendance PWA to GitHub...
echo ==============================================
cd /d "C:\Users\tlelo\.gemini\antigravity\scratch\attendance-pwa"
git push -u origin main
echo ==============================================
echo  Done! You can now deploy on Vercel.
echo ==============================================
pause
