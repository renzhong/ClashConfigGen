module.exports = {
  apps : [{
    name: "clash_config_generator",
    script: "server.js",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3010
    }
  }]
};
