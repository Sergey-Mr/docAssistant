server {
    listen 8090;
    index index.php index.html;
    server_name docAssistant;
    error_log  /var/log/nginx/error_8090.log;
    access_log /var/log/nginx/access_8090.log;
    root /var/www/docAssistant/public;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        try_files $uri /index.php?$args;

        include       fastcgi_params;
        fastcgi_ignore_client_abort on;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        #fastcgi_pass 127.0.0.1:9000;
        fastcgi_param DOCUMENT_ROOT /var/www/docAssistant/public;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        #fastcgi_param HTTPS on;
    }
}