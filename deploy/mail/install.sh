#!/usr/bin/env bash
# Установка Postfix + OpenDKIM на чистый Ubuntu 24.04 для kids-ceo.ru.
# Запускать от root. Идемпотентен — повторный запуск безопасен.
#
# Что делает:
#   1. Ставит postfix, opendkim, opendkim-tools, mailutils
#   2. Генерирует DKIM-ключ (2048-bit, селектор "mail"), если его ещё нет
#   3. Конфигурирует OpenDKIM + Postfix (milter, loopback-only, TLS outbound)
#   4. Запускает и включает оба сервиса
#   5. Печатает публичную часть DKIM-ключа для вставки в DNS
#
# После установки остаётся вручную:
#   - прописать DNS-записи (A, SPF, DKIM, DMARC) в reg.ru
#   - попросить Beget установить PTR (46.173.24.16 -> mail.kids-ceo.ru)
#   - получить Let's Encrypt для mail.kids-ceo.ru через deploy/mail/enable-tls.sh

set -euo pipefail

DOMAIN=kids-ceo.ru
SELECTOR=mail
KEYDIR=/etc/opendkim/keys/$DOMAIN

if [ "$(id -u)" -ne 0 ]; then
  echo "Запускайте от root" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# --- 1. Пакеты ---
echo "==> postfix + opendkim + opendkim-tools + mailutils"
echo "postfix postfix/mailname string $DOMAIN" | debconf-set-selections
echo "postfix postfix/main_mailer_type select Internet Site" | debconf-set-selections
apt-get update -qq
apt-get install -y -qq postfix opendkim opendkim-tools mailutils dnsutils

# --- 2. Директории и DKIM-ключ ---
install -d -o opendkim -g opendkim -m 0750 /etc/opendkim
install -d -o opendkim -g opendkim -m 0750 /etc/opendkim/keys
install -d -o opendkim -g opendkim -m 0700 "$KEYDIR"

if [ ! -f "$KEYDIR/$SELECTOR.private" ]; then
  echo "==> генерирую DKIM-ключ (2048 bit)"
  (cd "$KEYDIR" && opendkim-genkey -b 2048 -s "$SELECTOR" -d "$DOMAIN")
  chown opendkim:opendkim "$KEYDIR/$SELECTOR.private" "$KEYDIR/$SELECTOR.txt"
  chmod 600 "$KEYDIR/$SELECTOR.private"
  chmod 644 "$KEYDIR/$SELECTOR.txt"
else
  echo "==> DKIM-ключ уже существует, не трогаю"
fi

# --- 3. OpenDKIM таблицы ---
cat > /etc/opendkim/key.table <<EOF
${SELECTOR}._domainkey.${DOMAIN} ${DOMAIN}:${SELECTOR}:${KEYDIR}/${SELECTOR}.private
EOF

cat > /etc/opendkim/signing.table <<EOF
*@${DOMAIN} ${SELECTOR}._domainkey.${DOMAIN}
EOF

cat > /etc/opendkim/trusted.hosts <<EOF
127.0.0.1
localhost
*.${DOMAIN}
${DOMAIN}
EOF

chown -R opendkim:opendkim /etc/opendkim
chmod 644 /etc/opendkim/key.table /etc/opendkim/signing.table /etc/opendkim/trusted.hosts

# --- 4. /etc/opendkim.conf ---
cat > /etc/opendkim.conf <<'EOF'
# Managed by kids-ceo mail setup (deploy/mail/install.sh)
Syslog                  yes
UMask                   002
UserID                  opendkim

Socket                  inet:8891@localhost
PidFile                 /run/opendkim/opendkim.pid

AutoRestart             yes
AutoRestartRate         10/1M
Background              yes
Canonicalization        relaxed/simple
DNSTimeout              5
Mode                    sv
SignatureAlgorithm      rsa-sha256
SubDomains              no
OversignHeaders         From

KeyTable                /etc/opendkim/key.table
SigningTable            refile:/etc/opendkim/signing.table
ExternalIgnoreList      refile:/etc/opendkim/trusted.hosts
InternalHosts           refile:/etc/opendkim/trusted.hosts

TrustAnchorFile         /usr/share/dns/root.key
EOF

# Занулим /etc/default/opendkim — чтобы он не переопределял Socket из opendkim.conf
if [ -f /etc/default/opendkim ]; then
  cat > /etc/default/opendkim <<'EOF'
# Socket настраивается в /etc/opendkim.conf.
# (файл намеренно пустой)
EOF
fi

# --- 5. Postfix main.cf ---
[ -f /etc/postfix/main.cf.orig ] || cp /etc/postfix/main.cf /etc/postfix/main.cf.orig

postconf -e "myhostname = mail.${DOMAIN}"
postconf -e "mydomain = ${DOMAIN}"
postconf -e "myorigin = \$mydomain"
postconf -e "mydestination = \$myhostname, localhost.\$mydomain, localhost"
postconf -e "inet_interfaces = loopback-only"
postconf -e "inet_protocols = ipv4"
postconf -e "mynetworks = 127.0.0.0/8 [::1]/128"
postconf -e "smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, defer_unauth_destination"
postconf -e "smtp_tls_security_level = may"
postconf -e "smtp_tls_loglevel = 1"
postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
postconf -e "milter_default_action = accept"
postconf -e "milter_protocol = 6"
postconf -e "smtpd_milters = inet:127.0.0.1:8891"
postconf -e "non_smtpd_milters = inet:127.0.0.1:8891"
postconf -e "message_size_limit = 10485760"

# --- 6. Restart ---
systemctl enable --now opendkim
systemctl restart opendkim
systemctl enable --now postfix
systemctl restart postfix

sleep 1

echo
echo "==> статус"
systemctl is-active opendkim postfix | head -2
ss -tlnp | grep -E ':(25|8891) ' || true

echo
echo "==> DKIM public key (скопируй в TXT-запись mail._domainkey.${DOMAIN}):"
cat "$KEYDIR/$SELECTOR.txt"

echo
echo "Готово. Следующие шаги:"
echo "  1. В reg.ru создать 4 DNS-записи (см. deploy/mail/README.md)"
echo "  2. Тикет в Beget: PTR 46.173.24.16 -> mail.${DOMAIN}"
echo "  3. После пропагации DNS — запустить deploy/mail/enable-tls.sh"
echo "  4. Тест: mail-tester.com — прислать письмо, смотреть score"
