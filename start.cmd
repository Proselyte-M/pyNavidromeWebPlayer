@echo off
python.exe -m waitress --host=0.0.0.0 --port=5000 --threads=8 main:app
pause