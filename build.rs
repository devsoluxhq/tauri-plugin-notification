// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

// BeyPilot fork: only the three commands registered in `init()`'s
// `invoke_handler` (see src/lib.rs). The full upstream 16-command set is
// intentionally not exposed; do not re-add commands here without also
// registering them in the invoke handler.
const COMMANDS: &[&str] = &["notify", "request_permission", "is_permission_granted"];

fn main() {
    let result = tauri_plugin::Builder::new(COMMANDS)
        .global_api_script_path("./api-iife.js")
        .android_path("android")
        .ios_path("ios")
        .try_build();

    // when building documentation for Android the plugin build result is always Err() and is irrelevant to the crate documentation build
    if !(cfg!(docsrs) && std::env::var("TARGET").unwrap().contains("android")) {
        result.unwrap();
    }
}
