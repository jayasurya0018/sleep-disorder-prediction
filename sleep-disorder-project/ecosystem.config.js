module.exports = {
  apps: [
    {
      name: 'sleep-disorder-api',
      script: './index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './server/logs/error.log',
      out_file: './server/logs/out.log',
      log_file: './server/logs/combined.log',
      time_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        'test-outputs'
      ],
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'sleep-disorder-client',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: './client',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './client/logs/error.log',
      out_file: './client/logs/out.log',
      max_memory_restart: '300M',
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/sleep-disorder.git',
      path: '/var/www/sleep-disorder',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production server"'
    }
  }
};
