const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withPodfileMods(
  config,
  { linkage = "static", modularHeaders = true } = {}
) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      // Ensure use_frameworks! with chosen linkage (static is default in RN/Expo, but we enforce it)
      if (!contents.match(/use_frameworks!/)) {
        contents = contents.replace(
          /target\s+'[^']+'\s+do/,
          (m) => `${m}\n  use_frameworks! :linkage => :${linkage}`
        );
      } else {
        contents = contents.replace(
          /use_frameworks![^\n]*/g,
          `use_frameworks! :linkage => :${linkage}`
        );
      }

      // Add use_modular_headers! to expose modules for Obj-C pods like GoogleUtilities
      if (modularHeaders && !contents.includes("use_modular_headers!")) {
        contents = contents.replace(
          /use_frameworks![^\n]*\n/,
          (m) => `${m}  use_modular_headers!\n`
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
