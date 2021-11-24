# WooDoo
<img alt="downloads" src="https://img.shields.io/npm/dt/woodoo?style=flat-square"> <img alt="version" src="https://img.shields.io/npm/v/woodoo?style=flat-square"> <img alt="issues" src="https://img.shields.io/github/issues/ferrriii/WooDoo?style=flat-square"> <img alt="package size" src="https://img.shields.io/bundlephobia/minzip/woodoo?style=flat-square"> <img alt="forks" src="https://img.shields.io/github/forks/ferrriii/WooDoo?style=flat-square"> <img alt="stars" src="https://img.shields.io/github/stars/ferrriii/WooDoo?style=flat-square"> <img alt="license" src="https://img.shields.io/github/license/ferrriii/WooDoo?style=flat-square"> <img alt="programming language" src="https://img.shields.io/github/languages/top/ferrriii/WooDoo?style=flat-square">

A ~1.2kb (<img alt="package size" src="https://img.shields.io/bundlephobia/minzip/woodoo?style=flat-square">) alternative to React and Vue.

WooDoo is a simple and lightweight library for creating reactive, state-based UI.
Features:

- Template literals (Template strings) support
- Event bindings
- Efficient and fast
- IE 11 and major browsers support (> 0.25%)

## Getting Started
Use below template to get started.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>WooDoo Hello World!</title>
  </head>
  <body>
    <div id="app">App Placeholder</div>
    
    <script src="https://unpkg.com/woodoo"></script>
    <script>
      let app = new WooDoo({
          element: '#app',
          data: {
            text: 'Hello !',
          },
          template() {
            return `              
              Counter: <span>${this.text}</span>
            `
          }
        }
      )
      app.render()
    </script>
  </body>
</html>

```

If you would like to use ES modules, include below script in your app.

```html
<script type="module" src="https://unpkg.com/woodoo/dist/esm/index-min.js"></script>
```
