module.exports = {
  apps: [
    {
      name: "pdfsun-core-engine",
      script: "dist/server.cjs",
      instances: "max", // Utilize all CPU cores in cluster mode
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Auto-restart worker if memory exceeds 1GB to prevent leaks
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Zero-downtime rolling reload configuration
      listen_timeout: 8000,
      kill_timeout: 5000,
      wait_ready: true,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
