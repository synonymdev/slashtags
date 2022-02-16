# Slashtags-core

> Plugin framework for Slashtags nodes.

Slashtags core provides a plugins architecture framework, to build the core protocol features as well as extending clients in app-land in a highly modular manner.

- [Features](#features)
- [Install](#install)
- [Example](#example)
- [API](#api)
- [License](#license)

## Features

- Asynchronous loading of plugins similar to [avvio](https://github.com/fastify/avvio)/[fastify](https://github.com/fastify/fastify).
- Decorate the client with values and methods from plugins.
- Emit events from anywhere and await all async listeners.
- Life cycle hooks.

## Install

```bash
npm install @synonymdev/slashtags-loader
```

## Example

```js
import slashtags from '@synonymdev/slashtags-core';

const logs = [];
const logger = { ...console, log: (...args) => logs.push(...args) };

const slash = await slashtags({ logger })
  .use(first, { foo: 1 })
  .use(third, { foo: 3 })
  .ready();

// logs = ['first loaded', 'second loaded', 'third loaded']
// slash.first = 1
// slash.second = 2
// slash.third = 3

async function first(slash, options) {
  slash.logger.log('first loaded');
  slash.use(second, { foo: 2 });
  slash.decorate('first', options.foo);
  slash.onReady(afterReady.bind(slash));
  slash.onClose(afterClose.bind(slash));
}

async function second(slash, options) {
  slash.logger.log('second loaded');
  slash.decorate('second', options.foo);
}

async function third(slash, options) {
  slash.logger.log('third loaded');
  slash.decorate('third', options.foo);
}

async function afterReady(slash) {
  return new Promise((resolve) => {
    setTimeout(() => {
      this.logger.log('after all');
      resolve();
    }, 10);
  });
}

async function afterClose(slash) {
  return new Promise((resolve) => {
    setTimeout(() => {
      this.logger.log('after close');
      resolve();
    }, 10);
  });
}
```

## API

- <a href="#constructor"><code><b>slashtags()</b></code></a>
- <a href="#use"><code><b>slash.use()</b></code></a>
- <a href="#ready"><code><b>slash.ready()</b></code></a>
- <a href="#decorate"><code><b>slash.decorate()</b></code></a>
- <a href="#emit"><code><b>slash.emit()</b></code></a>
- <a href="#onready"><code><b>slash.onReady()</b></code></a>
- <a href="#onclose"><code><b>slash.onClose()</b></code></a>
- <a href="#close"><code><b>slash.status</b></code></a>

---

<a name="#constructor"></a>

### slash = slashtags([options])

Options:

- `logger`: [abstract-logging](https://github.com/jsumners/abstract-logging) compatible logger.

<a name="#use"></a>

### slash.use(plugin, [options])

Returns a thenable instance of slashtags, so it can be awaited, or chained with `.ready()` or `.use()` for other plugins.

- `plugin`: The plugin to load.
- `options`: Options to pass to the plugin.

<a name="#ready"></a>

### slash.ready()

Returns a promise of the instance, after omitting `onReady` and executing all async listeners for that event.

Once `ready()` is called, `.use()` and `.decorate()` can't be called.

<a name="#decorate"></a>

### slash.decorate(name, value)

Adds a value to the instance, and returns the instance.

Unlike `fastify` there is no encapsulation by default, so all decorators are going to be on the root instance, `.decorate()` it will throw an error if the property already exists.

<a name="#emit"></a>

### slash.emit(type, ...args)

Same as `EventEmitter.emit()`, but returns a promise that resolves after awaiting all listeners for that event.

<a name="#onready"></a>

### slash.onReady(cb)

Same as `EventEmitter.on('onReady', cb)`.

<a name="#onclose"></a>

### slash.onClose(cb)

Same as `EventEmitter.on('onClose', cb)`.

<a name="#close"></a>

### slash.close()

Emits `onClose` and returns a promise that resolves after awaiting all listeners for that event.

## License

Licensed under [MIT][].

[mit]: ../../LICENSE
