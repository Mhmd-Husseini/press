module.exports = {
  apps: [
    {
      name: 'phoenix-press',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/phoenix-press/press',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXTAUTH_URL: 'http://51.20.78.91',
        NEXTAUTH_SECRET: 'your-super-secure-nextauth-secret-key-2024-phoenix-press'
      },
      error_file: '/var/log/phoenix-press/error.log',
      out_file: '/var/log/phoenix-press/access.log',
      log_file: '/var/log/phoenix-press/combined.log',
      time: true,
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=400',
      kill_timeout: 5000,
      restart_delay: 1000,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
}; 