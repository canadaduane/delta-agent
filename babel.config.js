module.exports = function(api) {
  api.cache(true);

  const presets = ["@babel/preset-env"];
  const plugins = [
    ["@babel/transform-runtime", { helpers: true, regenerator: true }]
  ];

  return {
    presets,
    plugins
  };
};
