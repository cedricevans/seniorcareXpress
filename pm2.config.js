module.exports = {
  apps: [
    {
      name: 'seniorcare-pocketbase',
      cwd: './apps/pocketbase',
      script: './pocketbase',
      args: 'serve --http=0.0.0.0:8090 --dir=./pb_data --migrationsDir=./pb_migrations --hooksDir=./pb_hooks --hooksWatch=false',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
    {
      name: 'seniorcare-api',
      cwd: './apps/api',
      script: 'src/main.js',
      interpreter: 'node',
      env_file: './apps/api/.env',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
