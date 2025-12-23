module.exports = {
  apps: [
    {
      name: 'nonxdev-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: '2',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
