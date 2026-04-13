# Развёртывание Kids CEO на Ubuntu (Beget)

## 1. Подготовка сервера

### Подключение по SSH
```bash
ssh user@your-server-ip
```

### Установка Node.js 20 (через nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

### Установка PM2
```bash
npm install -g pm2
pm2 startup  # следовать инструкции для автозапуска
```

### Установка Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

### Установка PostgreSQL 16
```bash
sudo apt install -y postgresql postgresql-contrib
```

### Установка Certbot (SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 2. Настройка PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER kids_ceo_user WITH PASSWORD 'СГЕНЕРИРОВАТЬ_ПАРОЛЬ';
CREATE DATABASE kids_ceo OWNER kids_ceo_user;
GRANT ALL PRIVILEGES ON DATABASE kids_ceo TO kids_ceo_user;
\q
```

---

## 3. Клонирование проекта

```bash
sudo mkdir -p /var/www/kids-ceo
sudo chown $USER:$USER /var/www/kids-ceo
cd /var/www/kids-ceo
git clone https://github.com/Cyberj1nn/kids-ceo.git .
```

---

## 4. Настройка окружения

### Создать .env
```bash
cp .env.production .env
nano .env
```

Заполнить:
- `DB_PASSWORD` — пароль из шага 2
- `JWT_SECRET` и `JWT_REFRESH_SECRET` — сгенерировать:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 5. Сборка и миграция

```bash
# Сервер
cd /var/www/kids-ceo/server
npm ci
npm run build
npm run migrate
npm run seed

# Клиент
cd /var/www/kids-ceo/client
npm ci
npm run build
```

---

## 6. Запуск через PM2

```bash
cd /var/www/kids-ceo
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

Проверка:
```bash
pm2 status
curl http://localhost:3000/api/health
```

---

## 7. Настройка Nginx

```bash
sudo cp /var/www/kids-ceo/deploy/nginx.conf /etc/nginx/sites-available/kids-ceo
sudo ln -s /etc/nginx/sites-available/kids-ceo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL-сертификат (Let's Encrypt)

**Перед этим шагом** — убедиться, что DNS A-запись `kids-ceo.ru` указывает на IP сервера.

Временно закомментировать блок `listen 443` в nginx конфиге, затем:

```bash
sudo certbot --nginx -d kids-ceo.ru -d www.kids-ceo.ru
```

Certbot автоматически обновит конфигурацию Nginx. Восстановить полный конфиг:
```bash
sudo cp /var/www/kids-ceo/deploy/nginx.conf /etc/nginx/sites-available/kids-ceo
sudo nginx -t
sudo systemctl reload nginx
```

Автообновление сертификата:
```bash
sudo certbot renew --dry-run
```

---

## 9. GitHub Actions (автодеплой)

В репозитории GitHub → Settings → Secrets → Actions добавить:

| Secret | Значение |
|--------|----------|
| `SERVER_HOST` | IP-адрес сервера |
| `SERVER_USER` | имя пользователя SSH |
| `SSH_PRIVATE_KEY` | приватный SSH-ключ |

### Настройка SSH-ключа на сервере:
```bash
# На локальной машине
ssh-keygen -t ed25519 -f ~/.ssh/kids-ceo-deploy -C "deploy@kids-ceo"

# Скопировать публичный ключ на сервер
ssh-copy-id -i ~/.ssh/kids-ceo-deploy.pub user@server-ip

# Содержимое приватного ключа → в GitHub Secret SSH_PRIVATE_KEY
cat ~/.ssh/kids-ceo-deploy
```

Теперь каждый `git push` в `main` автоматически развернёт обновление.

---

## 10. Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Полезные команды

```bash
# Статус сервера
pm2 status
pm2 logs kids-ceo-api

# Перезапуск
pm2 restart kids-ceo-api

# Применить новые миграции
cd /var/www/kids-ceo/server && npm run migrate

# Пересобрать клиент
cd /var/www/kids-ceo/client && npm run build

# Проверить Nginx
sudo nginx -t
sudo systemctl reload nginx

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## Чек-лист после развёртывания

- [ ] `https://kids-ceo.ru` открывается, редиректит на `/login`
- [ ] Вход суперадмином (superadmin / admin123)
- [ ] **Сменить пароль суперадмина** через админку
- [ ] Создание тестового пользователя через админку
- [ ] Открытие вкладок пользователю
- [ ] Проверка чата (отправка сообщения)
- [ ] Проверка загрузки файлов
- [ ] Проверка ДТП (заполнение ячейки)
- [ ] Проверка PWA (установка на телефон)
