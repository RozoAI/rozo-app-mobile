const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withPodfileMods(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let s = fs.readFileSync(podfilePath, "utf8");

      // Ensure use_frameworks! :linkage => :static
      if (s.includes("use_frameworks!")) {
        s = s.replace(
          /use_frameworks![^\n]*/g,
          "use_frameworks! :linkage => :static"
        );
      } else {
        s = s.replace(
          /target\s+'[^']+'\s+do/,
          (m) => `${m}\n  use_frameworks! :linkage => :static`
        );
      }

      // Ensure use_modular_headers!
      if (!s.includes("use_modular_headers!")) {
        s = s.replace(
          /use_frameworks![^\n]*\n/,
          (m) => `${m}  use_modular_headers!\n`
        );
      }

      // Add pre_install hook for React Native Firebase fix
      if (!s.includes("pre_install do |installer|")) {
        const preInstallHook = `
  # Disable modular headers for React Native Firebase to fix non-modular header errors
  pre_install do |installer|
    Pod::Installer::Xcode::TargetValidator.send(:define_method, :verify_no_static_framework_transitive_dependencies) {}

    installer.pod_targets.each do |pod|
      if pod.name.start_with?('RNFB')
        def pod.build_type
          Pod::BuildType.static_library
        end
      end
    end
  end

`;
        // Insert before post_install
        if (s.includes("post_install do |installer|")) {
          s = s.replace(
            /post_install do \|installer\|/,
            `${preInstallHook}  post_install do |installer|`
          );
        } else {
          // If no post_install yet, add it before the end of target block
          s = s.replace(/end\s*$/, `${preInstallHook}end`);
        }
      }

      // Ensure post_install block exists and sets flags
      if (!s.includes("post_install do |installer|")) {
        s += `
post_install do |installer|
  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      config.build_settings['DEFINES_MODULE'] = 'YES'
    end
  end
end
`;
      } else {
        // Patch existing post_install to add the two flags if missing
        s = s.replace(
          /post_install do \|installer\|[\s\S]*end\s*$/m,
          (block) => {
            let b = block;
            if (
              !b.includes(
                "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"
              )
            ) {
              b = b.replace(
                /t\.build_configurations.*?do \|config\|[\s\S]*?end/m,
                (inner) =>
                  inner.replace(
                    /do \|config\|/,
                    "do |config|\n      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'"
                  )
              );
            }
            if (!b.includes("DEFINES_MODULE")) {
              b = b.replace(
                /t\.build_configurations.*?do \|config\|[\s\S]*?end/m,
                (inner) =>
                  inner.replace(
                    /do \|config\|/,
                    "do |config|\n      config.build_settings['DEFINES_MODULE'] = 'YES'"
                  )
              );
            }
            return b;
          }
        );
      }

      fs.writeFileSync(podfilePath, s);
      return cfg;
    },
  ]);
};
