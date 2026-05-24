// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

import terser from '@rollup/plugin-terser'
import ts from 'typescript'

const tauriCoreVirtualId = '\0tauri-core-shim'

function onwarn(warning) {
  throw Object.assign(new Error(warning.message), warning)
}

function typescriptTranspile() {
  return {
    name: 'typescript-transpile',
    transform(code, id) {
      if (!id.endsWith('.ts')) {
        return null
      }

      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020
        },
        fileName: id
      })

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null
      }
    }
  }
}

function tauriCoreShim() {
  return {
    name: 'tauri-core-shim',
    resolveId(id) {
      return id === '@tauri-apps/api/core' ? tauriCoreVirtualId : null
    },
    load(id) {
      if (id !== tauriCoreVirtualId) {
        return null
      }

      return `
const ipcKey = '__TAURI_TO_IPC_KEY__'

class Channel {
  constructor(onmessage) {
    this.onmessage = onmessage || (() => {})
    this.nextMessageIndex = 0
    this.pendingMessages = []
    this.endIndex = undefined
    this.id = window.__TAURI_INTERNALS__.transformCallback((message) => {
      const index = message.index
      if ('end' in message) {
        if (index === this.nextMessageIndex) {
          this.cleanupCallback()
        } else {
          this.endIndex = index
        }
        return
      }

      if (index === this.nextMessageIndex) {
        this.onmessage(message.message)
        this.nextMessageIndex += 1

        while (this.nextMessageIndex in this.pendingMessages) {
          const pendingMessage = this.pendingMessages[this.nextMessageIndex]
          this.onmessage(pendingMessage)
          delete this.pendingMessages[this.nextMessageIndex]
          this.nextMessageIndex += 1
        }

        if (this.nextMessageIndex === this.endIndex) {
          this.cleanupCallback()
        }
      } else {
        this.pendingMessages[index] = message.message
      }
    })
  }

  cleanupCallback() {
    window.__TAURI_INTERNALS__.unregisterCallback(this.id)
  }

  [ipcKey]() {
    return \`__CHANNEL__:\${this.id}\`
  }

  toJSON() {
    return this[ipcKey]()
  }
}

class Listener {
  constructor(plugin, event, channelId) {
    this.plugin = plugin
    this.event = event
    this.channelId = channelId
  }

  async unregister() {
    return await invoke(\`plugin:\${this.plugin}|remove_listener\`, {
      event: this.event,
      channelId: this.channelId
    })
  }
}

export async function invoke(cmd, args = {}, options) {
  return await window.__TAURI_INTERNALS__.invoke(cmd, args, options)
}

export async function addPluginListener(plugin, event, cb) {
  const handler = new Channel(cb)
  try {
    await invoke(\`plugin:\${plugin}|register_listener\`, { event, handler })
  } catch {
    await invoke(\`plugin:\${plugin}|registerListener\`, { event, handler })
  }
  return new Listener(plugin, event, handler.id)
}
`
    }
  }
}

export default [
  {
    input: 'guest-js/index.ts',
    external: ['@tauri-apps/api/core'],
    output: [
      {
        file: 'dist-js/index.js',
        format: 'esm'
      },
      {
        exports: 'named',
        file: 'dist-js/index.cjs',
        format: 'cjs'
      }
    ],
    plugins: [typescriptTranspile()],
    onwarn
  },
  {
    input: 'guest-js/index.ts',
    output: {
      banner: "if ('__TAURI__' in window) {",
      file: 'api-iife.js',
      footer:
        "Object.defineProperty(window.__TAURI__, 'notification', { value: __TAURI_PLUGIN_NOTIFICATION__ })\n}",
      format: 'iife',
      name: '__TAURI_PLUGIN_NOTIFICATION__'
    },
    plugins: [tauriCoreShim(), typescriptTranspile(), terser()],
    onwarn
  },
  {
    input: 'guest-js/init.ts',
    output: {
      file: 'src/init-iife.js',
      format: 'iife'
    },
    plugins: [tauriCoreShim(), typescriptTranspile(), terser()],
    onwarn
  }
]
