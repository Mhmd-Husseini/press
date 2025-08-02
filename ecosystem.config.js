module.exports = {
  apps: [
    {
      name: 'phoenix-press',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/phoenix-press',
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/phoenix-press/error.log',
      out_file: '/var/log/phoenix-press/access.log',
      log_file: '/var/log/phoenix-press/combined.log',
      time: true,
      max_memory_restart: '200M',
      node_args: '--max-old-space-size=200',
      kill_timeout: 5000,
      restart_delay: 1000,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
}; 