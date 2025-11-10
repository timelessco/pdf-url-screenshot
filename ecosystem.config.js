module.exports = {
  apps: [
    {
      name: 'pdf-screenshot',
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_PUBLIC_BUCKET_URL: process.env.R2_PUBLIC_BUCKET_URL,
        R2_MAIN_BUCKET_NAME: process.env.R2_MAIN_BUCKET_NAME
      },
      env_file: '.env',
      error_file: './logs/err.log',
      // out_file: './logs/out.log',
      // log_file: './logs/combined.log',
      time: true
    }
  ]
};

  