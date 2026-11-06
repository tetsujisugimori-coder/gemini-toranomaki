#!/bin/sh
export WEBKIT_EXEC_PATH=/workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/bin
export WEBKIT_INJECTED_BUNDLE_PATH=/workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/lib
export WEBKIT_INSPECTOR_RESOURCES_PATH=/workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/share
export LD_LIBRARY_PATH=/workspace/chapter10-independent-20261106/webkit-deps/usr/lib/x86_64-linux-gnu:/workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/lib:/workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/sys/lib
exec /workspace/.cache/ms-playwright/webkit-2370/minibrowser-wpe/bin/MiniBrowser "$@"
