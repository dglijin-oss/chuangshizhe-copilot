module.exports = {
  apps: [
    {
      name: "ip-copilot",
      cwd: "/opt/chuangshizhe-copilot/apps/ip-copilot",
      script: "npx",
      args: "next start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/ip-copilot-error.log",
      out_file: "/var/log/pm2/ip-copilot-out.log",
      merge_logs: true,
    },
    {
      name: "admin",
      cwd: "/opt/chuangshizhe-copilot/apps/admin",
      script: "npx",
      args: "next start",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/admin-error.log",
      out_file: "/var/log/pm2/admin-out.log",
      merge_logs: true,
    },
  ],
};
