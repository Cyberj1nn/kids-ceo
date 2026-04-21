# Mail server (Postfix + OpenDKIM) для kids-ceo.ru

Собственный SMTP-релей на VPS Beget (46.173.24.16) для отправки транзакционных
писем с адреса `noreply@kids-ceo.ru`. Приложение kids-ceo-api шлёт через
`localhost:25` без аутентификации; Postfix подписывает письма DKIM и отправляет
наружу.

## Архитектура

```
kids-ceo-api (Node) ──(SMTP localhost:25, no auth)──► Postfix (loopback-only)
                                                          │
                                                          │  milter inet:127.0.0.1:8891
                                                          ▼
                                                       OpenDKIM (подпись заголовка)
                                                          │
                                                          ▼
                                                  Внешние SMTP (Gmail/Mail.ru/Яндекс)
```

- Postfix слушает только `127.0.0.1:25` — извне никто подключиться не может
  (защита от использования как open relay).
- OpenDKIM слушает `127.0.0.1:8891`, подписывает письма ключом `mail._domainkey.kids-ceo.ru`.
- Входящая почта **не принимается** (нет MX-записи, `inet_interfaces=loopback-only`).

## DNS-записи (в панели reg.ru для зоны kids-ceo.ru)

| Тип | Host | Значение |
|---|---|---|
| A | `mail` | `46.173.24.16` |
| TXT | `@` | `v=spf1 ip4:46.173.24.16 -all` |
| TXT | `mail._domainkey` | `v=DKIM1; h=sha256; k=rsa; p=<public key>` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:fesha.lucky@gmail.com` |

Публичная часть DKIM-ключа лежит на сервере в
`/etc/opendkim/keys/kids-ceo.ru/mail.txt`. При пересоздании ключа
(`opendkim-genkey -s mail -d kids-ceo.ru -b 2048`) TXT-запись нужно обновить.

## PTR (rDNS)

Задаётся у провайдера VPS (Beget) — запрос в поддержку:

> IP: 46.173.24.16 → PTR: mail.kids-ceo.ru

Без PTR крупные провайдеры (Gmail, Mail.ru, Яндекс) чаще всего кидают в спам
или отвергают письма. Это самая критичная часть — DKIM/SPF не компенсируют
отсутствие PTR.

## Установка с нуля

На чистом Ubuntu 24.04 запустить `deploy/mail/install.sh` от root.
Скрипт идемпотентен — повторный запуск не ломает конфиг.

## Проверки после установки

```bash
# Процессы слушают
ss -tlnp | grep -E ':(25|8891) '

# Postfix видит milter
postconf smtpd_milters  # должно быть: inet:127.0.0.1:8891

# Тест: отправить письмо через local sendmail
echo "Subject: Test\n\nhello" | sendmail -f noreply@kids-ceo.ru you@example.com
tail -f /var/log/mail.log  # смотреть что DKIM подписал и письмо ушло

# Полный тест доставляемости: mail-tester.com
# → получить адрес test-xxxxx@srv1.mail-tester.com
# → послать на него из приложения/sendmail
# → открыть mail-tester и смотреть score (целимся в ≥ 9/10)
```

## Конфиги (полная копия того, что на сервере)

- `postfix-main.cf.patch` — наши ключевые директивы main.cf (применяются через `postconf -e`)
- `opendkim.conf` — конфиг OpenDKIM
- `opendkim-key.table`, `opendkim-signing.table`, `opendkim-trusted.hosts` — DKIM таблицы
