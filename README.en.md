# XRender

XRender is a lightweight front-end framework focused on component-based development and data-driven view rendering. It provides Vue-like syntax and features, supporting data binding, directives, lifecycle hooks, and more.

## Features
- **Component-based Development**: Support for creating and reusing components.
- **Data Binding**: Support for two-way data binding and template interpolation.
- **Directive System**: Provides common directives such as `v-if`, `v-for`, `v-show`.
- **Lifecycle Hooks**: Supports lifecycle hooks like `created`, `mounted`, `updated`.
- **Plugin System**: Supports extending functionality through plugins.
- **Modular Architecture**: Core framework and functional modules are completely decoupled, supporting on-demand imports.
- **Version Management**: Built-in version management system supporting semantic versioning.
- **Independent Packaging**: Each module can be packaged independently, supporting versioned files and directories.
- **SSR Support**: Supports Server-Side Rendering (SSR).
- **Routing Support**: Supports routing management and navigation.
- **State Management**: Supports state management.
- **Reactive System**: Supports reactive data, computed properties, and deep watching.
- **Watcher System**: Supports data monitoring and reactive updates, including deep watching and immediate execution.
- **Internationalization**: Supports i18n and multi-language support.
- **AJAX Support**: Supports AJAX requests and data fetching.
- **MOCK Support**: Supports mock data and testing environments.
- **Mobile Adaptation**: Supports mobile adaptation and responsive design.

## Quick Start

### Installation

```bash
npm install xrender
```

### Basic Usage

```javascript
import 'xrender';

const App = $.component('App', {    
  render(createElem) {
    return createElem('div', {class:'page'}, 'Hello, XRender!', createElem(function(){
        return `<button type="button" @click="buttonClickHandle">{{msg}}</button>`
    }));
  },
  data(){
    return{
       msg:'Hello World!'
    }
  },
  methods: {
    buttonClickHandle() {
      console.log("Button Clicked");
    },
  },
});

$.createApp({ App }).$mount('#app');
```

### Modular Imports

XRender adopts a modular architecture where the core framework and functional modules are completely decoupled, supporting on-demand imports:

```javascript
// Import only the core framework (lightweight)
import XRender from 'xrender/core/xrender-1.0.0.es.js';

// Import functional modules on demand
import { Router } from 'xrender/router/xrender-router-1.0.0.es.js';
import { Store } from 'xrender/store/xrender-store-1.0.0.es.js';
import { I18n } from 'xrender/i18n/xrender-i18n-1.0.0.es.js';
import { Fetch } from 'xrender/fetch/xrender-fetch-1.0.0.es.js';
import 'xrender/touchs/xrender-touchs-1.0.0.es.js';

// Initialize functional modules
const router = new Router(routes);
const store = new Store({ state: {...} });
const i18n = new I18n({ locale: 'zh-CN', messages: {...} });
const fetch = new Fetch();

// Create application
XRender.createApp({ router, store, i18n, App }).$mount('#app');
```

### Using latest Links (Recommended)

Each module generates a `latest` directory pointing to the current latest version:

```javascript
// Use latest links to automatically get the latest version
import XRender from 'xrender/core/latest/xrender.es.js';
import { Router } from 'xrender/router/latest/xrender-router.es.js';
import { Store } from 'xrender/store/latest/xrender-store.es.js';
```

## Version Management

XRender has a built-in version management system supporting semantic versioning.

### View Versions

```bash
# View all module versions
npm run version:get

# View specific module version
npm run version:get xrender
```

### Set Version

```bash
# Set specific module version
npm run version:set xrender 1.2.0
```

### Upgrade Version

```bash
# Upgrade major version (incompatible API changes)
npm run version:bump xrender major

# Upgrade minor version (backward-compatible feature additions)
npm run version:bump xrender minor

# Upgrade patch version (backward-compatible bug fixes)
npm run version:bump xrender patch

# Upgrade all modules
npm run version:bump-all minor
```

### Build and Publish

```bash
# Build all modules
npm run build

# Build specific modules
npm run build:libs
npm run build:fetch
npm run build:router
npm run build:store
npm run build:i18n
npm run build:touchs

# Update latest links
npm run post-build:latest

# Clean old versions
npm run post-build:clean

# List all versions
npm run post-build:list
```

### Versioned Directory Structure

Built files are organized by version number:

```
dist/libs/
├── xrender/
│   ├── 1.0.0/
│   │   └── xrender-1.0.0.es.js
│   ├── 1.1.0/
│   │   └── xrender-1.1.0.es.js
│   └── latest/
│       └── xrender-1.1.0.es.js
├── router/
│   ├── 1.0.0/
│   │   ├── xrender-router-1.0.0.es.js
│   │   └── xrender-router-1.0.0.umd.js
│   └── latest/
│       ├── xrender-router-1.0.0.es.js
│       └── xrender-router-1.0.0.umd.js
└── ...
```

## Component-based Development
XRender supports creating and reusing components. Here's a simple component example:
```javascript
const MyComponent = $.component('MyComponent', {
  data() {
    return {
      message: 'Hello, XRender!'
    };
  },
  render(createElem) {
    return createElem('div', {}, this.data.message);
  }
});
```

## Data Binding
XRender supports two-way data binding and template interpolation. Here's a data binding example:
```javascript
const App = $.component('App', {
  data() {
    return {
      username: 'XRender User'
    };
  },
  render(createElem) {
    return createElem('div', {}, `Welcome, {{username}}!`);
  }
});
```

## Reactive System
XRender provides a powerful reactive system supporting data monitoring, computed properties, and deep watching.

### Computed Properties
Computed properties automatically calculate and cache results based on dependencies, recalculating only when dependencies change:
```javascript
const App = $.component('App', {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return `${this.data.firstName} ${this.data.lastName}`;
    }
  },
  render(createElem) {
    return createElem('div', {}, `Full Name: {{fullName}}`);
  }
});
```

### Watcher Monitoring
Watcher allows monitoring data changes and executing corresponding operations:
```javascript
const App = $.component('App', {
  data() {
    return {
      count: 0
    };
  },
  watch: {
    count(newVal, oldVal) {
      console.log(`Count changed from ${oldVal} to ${newVal}`);
    }
  },
  render(createElem) {
    return createElem('div', {}, `Count: {{count}}`);
  }
});
```

### Deep Watching
Deep watching can monitor changes within nested objects:
```javascript
const App = $.component('App', {
  data() {
    return {
      user: {
        name: 'John',
        age: 30,
        address: {
          city: 'New York'
        }
      }
    };
  },
  watch: {
    user: {
      handler(newVal, oldVal) {
        console.log('User changed:', newVal);
      },
      deep: true
    }
  },
  render(createElem) {
    return createElem('div', {}, `Name: {{user.name}}`);
  }
});
```

### Immediate Execution Watcher
Use the `immediate` option to execute the watcher immediately upon creation:
```javascript
const App = $.component('App', {
  data() {
    return {
      message: 'Hello'
    };
  },
  watch: {
    message: {
      handler(newVal) {
        console.log('Message:', newVal);
      },
      immediate: true
    }
  },
  render(createElem) {
    return createElem('div', {}, `Message: {{message}}`);
  }
});
```

## Directive System
XRender provides common directives such as `v-if`, `v-for`, `v-show`. Here's a directive example:
```javascript
const App = $.component('App', {
  data() {
    return {
      showMessage: true
    };
  },
  render(createElem) {
    return createElem('div', {}, [
      createElem('p', { 'v-if': 'showMessage' }, 'This is a message.')
    ]);
  }
});
```

## Lifecycle Hooks
XRender supports lifecycle hooks like `created`, `mounted`, `updated`. Here's a lifecycle hook example:
```javascript
const App = $.component('App', {
  created() {
    console.log('Component created');
  },
  mounted() {
    console.log('Component mounted');
  },
  updated() {
    console.log('Component updated');
  },
  render(createElem) {
    return createElem('div', {}, 'Hello, XRender!');
  }
});
```

## Plugin System
XRender supports extending functionality through plugins. Here's a plugin example:
```javascript
const MyPlugin = {
  install(app) {
    app.directive('myDirective', {
      bind(el, binding) {
        el.textContent = `My Directive: ${binding.value}`;
      }
    });
  }
};
$.use(MyPlugin);
```

## Server-Side Rendering (SSR)
XRender supports Server-Side Rendering (SSR). Here's an SSR example:
```javascript
const App = $.component('App', {
  render(createElem) {
    return createElem('div', {}, 'Hello, XRender!');
  }
});

const app = $.createApp({ App });
const html = app.$mount().$html();
console.log(html);
```

## License
XRender is released under the MIT License. Please see the [LICENSE](LICENSE) file for more information.

## Contributing
Contributions of code and documentation improvements are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to participate in the project.

---

### Documentation Notes
1. **Quick Start**: Provides simple installation and usage examples to help developers get started quickly.
2. **Core Concepts**: Introduces core concepts such as components, data binding, directives, and lifecycle hooks, with code examples.
3. **API Documentation**: Lists the main APIs of XRender for easy reference by developers.
4. **Example Projects**: Provides links to example projects showcasing practical applications of XRender.
5. **Contributing and License**: Encourages developers to contribute code and explains the open source license of the project.

Through this `README.md`, developers can quickly understand the features and usage of XRender and participate in project development.
