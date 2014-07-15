# Mobiblu

## Installation

1. `npm install steroids bower browserify -g`
2. `git clone http://github.com/octoblu/mobiblu.git`
3. `cd mobile`
4. `bower install`
5. `steroids connect`
    - Type `s` to launch simulator
    - Press `[enter]` to re-compile
    
    
## Deploy

Commit code first

1. `steroids deploy`
2. Go to build.appgyver.com and build the distributions you want

## Building Plugins

Plugin name must match what is `package.json` file.

In the plugin directory, compile `bundle.js` with `browserify  index.js -s 'skynetPlugins.[:plugin name]' > bundle.js`

**or** use gulp like in this example [skynet-mobile-plugin-greeting](https://github.com/skynetim/skynet-mobile-plugin-greeting)

1. Add name of plugin to array in `./www/data/local_plugins.json`
2. Add `bundle.js` and `package.json` to `./www/public/plugins/local_plugins/[:plugin name]`
    - Create Directory if needed.
    
    
**After every change to the app files you'll have to recompile by pressing enter in the steroids prompt.**