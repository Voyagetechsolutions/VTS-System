### Nginx: Rate limiting and basic WAF

```
map $http_authorization $auth_present { default 0; ~^Bearer 1; }

limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
  listen 443 ssl http2;
  server_name app.example.com;

  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

  location /rest/v1/ {
    if ($auth_present = 0) { return 401; }
    limit_req zone=api burst=40 nodelay;
    limit_conn addr 20;
    proxy_pass https://your-supabase-project.supabase.co$request_uri;
  }
}
```


