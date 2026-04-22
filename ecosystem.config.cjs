module.exports = {
  apps: [
    {
      name: 'maodou-blog-api',
      script: 'src/index.js',
      cwd: '/var/www/maodou-blog/maodou-blog/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/www/maodou-blog/logs/error.log',
      out_file: '/var/www/maodou-blog/logs/out.log',
    },
  ],
}
