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
        PORT: 3000,
        NEXTAUTH_URL: 'http://13.62.53.230',
        NEXTAUTH_SECRET: 'your-super-secure-nextauth-secret-key-2024-phoenix-press',
        JWT_ACCESS_SECRET: 'your-super-secure-jwt-secret-key-2024',
        DATABASE_URL: 'postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press',
        AWS_DEFAULT_REGION: 'eu-north-1',
        AWS_BUCKET: 'inventory-managment-husseini',
        AWS_URL: 'https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com',
        NEXT_PUBLIC_S3_URL: 'https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_APP_URL: 'http://13.62.53.230'
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