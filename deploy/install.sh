#!/usr/bin/env bash
# Установка на сервер (Debian/Ubuntu), запуск от root:
#   curl -fsSL https://raw.githubusercontent.com/igorao79/repohelper/main/deploy/install.sh | bash
# После установки положите секреты в /opt/repohelper/.env (образец — .env.example).
set -euo pipefail
DIR=/opt/repohelper

apt-get update -qq && apt-get install -y -qq git python3 python3-venv >/dev/null
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone https://github.com/igorao79/repohelper.git "$DIR"; fi
python3 -m venv "$DIR/.venv"
"$DIR/.venv/bin/pip" install -q -r "$DIR/requirements.txt"
[ -f "$DIR/.env" ] || { cp "$DIR/.env.example" "$DIR/.env"; chmod 600 "$DIR/.env"; echo "Заполните $DIR/.env"; }

cp "$DIR/deploy/repohelper.service" "$DIR/deploy/repohelper.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now repohelper.timer
systemctl list-timers repohelper.timer --no-pager
