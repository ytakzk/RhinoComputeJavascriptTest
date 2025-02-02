
var rhino3dm = (function() {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    return (
  function(rhino3dm) {
    rhino3dm = rhino3dm || {};
  
  // Copyright 2010 The Emscripten Authors.  All rights reserved.
  // Emscripten is available under two separate licenses, the MIT license and the
  // University of Illinois/NCSA Open Source License.  Both these licenses can be
  // found in the LICENSE file.
  
  // The Module object: Our interface to the outside world. We import
  // and export values on it. There are various ways Module can be used:
  // 1. Not defined. We create it here
  // 2. A function parameter, function(Module) { ..generated code.. }
  // 3. pre-run appended it, var Module = {}; ..generated code..
  // 4. External script tag defines var Module.
  // We need to check if Module already exists (e.g. case 3 above).
  // Substitution will be replaced with actual code on later stage of the build,
  // this way Closure Compiler will not mangle it (e.g. case 4. above).
  // Note that if you want to run closure, and also to use Module
  // after the generated code, you will need to define   var Module = {};
  // before the code. Then that object will be used in the code, and you
  // can continue to use Module afterwards as well.
  var Module = typeof rhino3dm !== 'undefined' ? rhino3dm : {};
  
  // --pre-jses are emitted after the Module integration code, so that they can
  // refer to Module (if they choose; they can also define Module)
  // {{PRE_JSES}}
  
  // Sometimes an existing Module object exists with properties
  // meant to overwrite the default module functionality. Here
  // we collect those properties and reapply _after_ we configure
  // the current environment's defaults to avoid having to be so
  // defensive during initialization.
  var moduleOverrides = {};
  var key;
  for (key in Module) {
    if (Module.hasOwnProperty(key)) {
      moduleOverrides[key] = Module[key];
    }
  }
  
  Module['arguments'] = [];
  Module['thisProgram'] = './this.program';
  Module['quit'] = function(status, toThrow) {
    throw toThrow;
  };
  Module['preRun'] = [];
  Module['postRun'] = [];
  
  // Determine the runtime environment we are in. You can customize this by
  // setting the ENVIRONMENT setting at compile time (see settings.js).
  
  var ENVIRONMENT_IS_WEB = false;
  var ENVIRONMENT_IS_WORKER = false;
  var ENVIRONMENT_IS_NODE = false;
  var ENVIRONMENT_IS_SHELL = false;
  ENVIRONMENT_IS_WEB = typeof window === 'object';
  ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
  
  if (Module['ENVIRONMENT']) {
    throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
  }
  
  
  // Three configurations we can be running in:
  // 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
  // 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
  // 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
  
  
  
  
  // `/` should be present at the end if `scriptDirectory` is not empty
  var scriptDirectory = '';
  function locateFile(path) {
    if (Module['locateFile']) {
      return Module['locateFile'](path, scriptDirectory);
    } else {
      return scriptDirectory + path;
    }
  }
  
  if (ENVIRONMENT_IS_NODE) {
    scriptDirectory = __dirname + '/';
  
    // Expose functionality in the same simple way that the shells work
    // Note that we pollute the global namespace here, otherwise we break in node
    var nodeFS;
    var nodePath;
  
    Module['read'] = function shell_read(filename, binary) {
      var ret;
        if (!nodeFS) nodeFS = require('fs');
        if (!nodePath) nodePath = require('path');
        filename = nodePath['normalize'](filename);
        ret = nodeFS['readFileSync'](filename);
      return binary ? ret : ret.toString();
    };
  
    Module['readBinary'] = function readBinary(filename) {
      var ret = Module['read'](filename, true);
      if (!ret.buffer) {
        ret = new Uint8Array(ret);
      }
      assert(ret.buffer);
      return ret;
    };
  
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    }
  
    Module['arguments'] = process['argv'].slice(2);
  
    // MODULARIZE will export the module in the proper place outside, we don't need to export here
  
    process['on']('uncaughtException', function(ex) {
      // suppress ExitStatus exceptions from showing an error
      if (!(ex instanceof ExitStatus)) {
        throw ex;
      }
    });
    // Currently node will swallow unhandled rejections, but this behavior is
    // deprecated, and in the future it will exit with error status.
    process['on']('unhandledRejection', abort);
  
    Module['quit'] = function(status) {
      process['exit'](status);
    };
  
    Module['inspect'] = function () { return '[Emscripten Module object]'; };
  } else
  if (ENVIRONMENT_IS_SHELL) {
  
  
    if (typeof read != 'undefined') {
      Module['read'] = function shell_read(f) {
        return read(f);
      };
    }
  
    Module['readBinary'] = function readBinary(f) {
      var data;
      if (typeof readbuffer === 'function') {
        return new Uint8Array(readbuffer(f));
      }
      data = read(f, 'binary');
      assert(typeof data === 'object');
      return data;
    };
  
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  
    if (typeof quit === 'function') {
      Module['quit'] = function(status) {
        quit(status);
      }
    }
  } else
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
      scriptDirectory = self.location.href;
    } else if (document.currentScript) { // web
      scriptDirectory = document.currentScript.src;
    }
    // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
    // is gone, so we saved it, and we use it here instead of any other info.
    if (_scriptDir) {
      scriptDirectory = _scriptDir;
    }
    // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
    // otherwise, slice off the final part of the url to find the script directory.
    // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
    // and scriptDirectory will correctly be replaced with an empty string.
    if (scriptDirectory.indexOf('blob:') !== 0) {
      scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
    } else {
      scriptDirectory = '';
    }
  
  
    Module['read'] = function shell_read(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.responseText;
    };
  
    if (ENVIRONMENT_IS_WORKER) {
      Module['readBinary'] = function readBinary(url) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.responseType = 'arraybuffer';
          xhr.send(null);
          return new Uint8Array(xhr.response);
      };
    }
  
    Module['readAsync'] = function readAsync(url, onload, onerror) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function xhr_onload() {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          onload(xhr.response);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
  
    Module['setWindowTitle'] = function(title) { document.title = title };
  } else
  {
    throw new Error('environment detection error');
  }
  
  // Set up the out() and err() hooks, which are how we can print to stdout or
  // stderr, respectively.
  // If the user provided Module.print or printErr, use that. Otherwise,
  // console.log is checked first, as 'print' on the web will open a print dialogue
  // printErr is preferable to console.warn (works better in shells)
  // bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
  var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
  var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));
  
  // Merge back in the overrides
  for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
      Module[key] = moduleOverrides[key];
    }
  }
  // Free the object hierarchy contained in the overrides, this lets the GC
  // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
  moduleOverrides = undefined;
  
  // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
  assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  
  
  
  // Copyright 2017 The Emscripten Authors.  All rights reserved.
  // Emscripten is available under two separate licenses, the MIT license and the
  // University of Illinois/NCSA Open Source License.  Both these licenses can be
  // found in the LICENSE file.
  
  // {{PREAMBLE_ADDITIONS}}
  
  var STACK_ALIGN = 16;
  
  // stack management, and other functionality that is provided by the compiled code,
  // should not be used before it is ready
  stackSave = stackRestore = stackAlloc = function() {
    abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
  };
  
  function staticAlloc(size) {
    abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
  }
  
  function dynamicAlloc(size) {
    assert(DYNAMICTOP_PTR);
    var ret = HEAP32[DYNAMICTOP_PTR>>2];
    var end = (ret + size + 15) & -16;
    if (end <= _emscripten_get_heap_size()) {
      HEAP32[DYNAMICTOP_PTR>>2] = end;
    } else {
      var success = _emscripten_resize_heap(end);
      if (!success) return 0;
    }
    return ret;
  }
  
  function alignMemory(size, factor) {
    if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
    return Math.ceil(size / factor) * factor;
  }
  
  function getNativeTypeSize(type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return 4; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
          return bits / 8;
        } else {
          return 0;
        }
      }
    }
  }
  
  function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
      warnOnce.shown[text] = 1;
      err(text);
    }
  }
  
  var asm2wasmImports = { // special asm2wasm imports
      "f64-rem": function(x, y) {
          return x % y;
      },
      "debugger": function() {
          debugger;
      }
  };
  
  
  
  var jsCallStartIndex = 1;
  var functionPointers = new Array(0);
  
  // Wraps a JS function as a wasm function with a given signature.
  // In the future, we may get a WebAssembly.Function constructor. Until then,
  // we create a wasm module that takes the JS function as an import with a given
  // signature, and re-exports that as a wasm function.
  function convertJsFunctionToWasm(func, sig) {
    // The module is static, with the exception of the type section, which is
    // generated based on the signature passed in.
    var typeSection = [
      0x01, // id: section,
      0x00, // length: 0 (placeholder)
      0x01, // count: 1
      0x60, // form: func
    ];
    var sigRet = sig.slice(0, 1);
    var sigParam = sig.slice(1);
    var typeCodes = {
      'i': 0x7f, // i32
      'j': 0x7e, // i64
      'f': 0x7d, // f32
      'd': 0x7c, // f64
    };
  
    // Parameters, length + signatures
    typeSection.push(sigParam.length);
    for (var i = 0; i < sigParam.length; ++i) {
      typeSection.push(typeCodes[sigParam[i]]);
    }
  
    // Return values, length + signatures
    // With no multi-return in MVP, either 0 (void) or 1 (anything else)
    if (sigRet == 'v') {
      typeSection.push(0x00);
    } else {
      typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
    }
  
    // Write the overall length of the type section back into the section header
    // (excepting the 2 bytes for the section id and length)
    typeSection[1] = typeSection.length - 2;
  
    // Rest of the module is static
    var bytes = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
      0x01, 0x00, 0x00, 0x00, // version: 1
    ].concat(typeSection, [
      0x02, 0x07, // import section
        // (import "e" "f" (func 0 (type 0)))
        0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
      0x07, 0x05, // export section
        // (export "f" (func 0 (type 0)))
        0x01, 0x01, 0x66, 0x00, 0x00,
    ]));
  
     // We can compile this wasm module synchronously because it is very small.
    // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
    var module = new WebAssembly.Module(bytes);
    var instance = new WebAssembly.Instance(module, {
      e: {
        f: func
      }
    });
    var wrappedFunc = instance.exports.f;
    return wrappedFunc;
  }
  
  // Add a wasm function to the table.
  function addFunctionWasm(func, sig) {
    var table = wasmTable;
    var ret = table.length;
  
    // Grow the table
    try {
      table.grow(1);
    } catch (err) {
      if (!err instanceof RangeError) {
        throw err;
      }
      throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
    }
  
    // Insert new element
    try {
      // Attempting to call this with JS function will cause of table.set() to fail
      table.set(ret, func);
    } catch (err) {
      if (!err instanceof TypeError) {
        throw err;
      }
      assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
      var wrapped = convertJsFunctionToWasm(func, sig);
      table.set(ret, wrapped);
    }
  
    return ret;
  }
  
  function removeFunctionWasm(index) {
    // TODO(sbc): Look into implementing this to allow re-using of table slots
  }
  
  // 'sig' parameter is required for the llvm backend but only when func is not
  // already a WebAssembly function.
  function addFunction(func, sig) {
  
  
    var base = 0;
    for (var i = base; i < base + 0; i++) {
      if (!functionPointers[i]) {
        functionPointers[i] = func;
        return jsCallStartIndex + i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  
  }
  
  function removeFunction(index) {
  
    functionPointers[index-jsCallStartIndex] = null;
  }
  
  var funcWrappers = {};
  
  function getFuncWrapper(func, sig) {
    if (!func) return; // on null pointer, return undefined
    assert(sig);
    if (!funcWrappers[sig]) {
      funcWrappers[sig] = {};
    }
    var sigCache = funcWrappers[sig];
    if (!sigCache[func]) {
      // optimize away arguments usage in common cases
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return dynCall(sig, func, [arg]);
        };
      } else {
        // general case
        sigCache[func] = function dynCall_wrapper() {
          return dynCall(sig, func, Array.prototype.slice.call(arguments));
        };
      }
    }
    return sigCache[func];
  }
  
  
  function makeBigInt(low, high, unsigned) {
    return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
  }
  
  function dynCall(sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  }
  
  var tempRet0 = 0;
  
  var setTempRet0 = function(value) {
    tempRet0 = value;
  }
  
  var getTempRet0 = function() {
    return tempRet0;
  }
  
  function getCompilerSetting(name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
  }
  
  var Runtime = {
    // helpful errors
    getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
    staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
    stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  };
  
  // The address globals begin at. Very low in memory, for code size and optimization opportunities.
  // Above 0 is static memory, starting with globals.
  // Then the stack.
  // Then 'dynamic' memory for sbrk.
  var GLOBAL_BASE = 1024;
  
  
  
  
  // === Preamble library stuff ===
  
  // Documentation for the public APIs defined in this file must be updated in:
  //    site/source/docs/api_reference/preamble.js.rst
  // A prebuilt local version of the documentation is available at:
  //    site/build/text/docs/api_reference/preamble.js.txt
  // You can also build docs locally as HTML or other formats in site/
  // An online HTML version (which may be of a different version of Emscripten)
  //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
  
  
  if (typeof WebAssembly !== 'object') {
    abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
  }
  
  
  /** @type {function(number, string, boolean=)} */
  function getValue(ptr, type, noSafe) {
    type = type || 'i8';
    if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
      switch(type) {
        case 'i1': return HEAP8[((ptr)>>0)];
        case 'i8': return HEAP8[((ptr)>>0)];
        case 'i16': return HEAP16[((ptr)>>1)];
        case 'i32': return HEAP32[((ptr)>>2)];
        case 'i64': return HEAP32[((ptr)>>2)];
        case 'float': return HEAPF32[((ptr)>>2)];
        case 'double': return HEAPF64[((ptr)>>3)];
        default: abort('invalid type for getValue: ' + type);
      }
    return null;
  }
  
  
  
  
  // Wasm globals
  
  var wasmMemory;
  
  // Potentially used for direct table calls.
  var wasmTable;
  
  
  //========================================
  // Runtime essentials
  //========================================
  
  // whether we are quitting the application. no code should run after this.
  // set in exit() and abort()
  var ABORT = false;
  
  // set by exit() and abort().  Passed to 'onExit' handler.
  // NOTE: This is also used as the process return code code in shell environments
  // but only when noExitRuntime is false.
  var EXITSTATUS = 0;
  
  /** @type {function(*, string=)} */
  function assert(condition, text) {
    if (!condition) {
      abort('Assertion failed: ' + text);
    }
  }
  
  // Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
  function getCFunc(ident) {
    var func = Module['_' + ident]; // closure exported function
    assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
    return func;
  }
  
  // C calling interface.
  function ccall(ident, returnType, argTypes, args, opts) {
    // For fast lookup of conversion functions
    var toC = {
      'string': function(str) {
        var ret = 0;
        if (str !== null && str !== undefined && str !== 0) { // null string
          // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
          var len = (str.length << 2) + 1;
          ret = stackAlloc(len);
          stringToUTF8(str, ret, len);
        }
        return ret;
      },
      'array': function(arr) {
        var ret = stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret;
      }
    };
  
    function convertReturnValue(ret) {
      if (returnType === 'string') return UTF8ToString(ret);
      if (returnType === 'boolean') return Boolean(ret);
      return ret;
    }
  
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret;
  }
  
  function cwrap(ident, returnType, argTypes, opts) {
    return function() {
      return ccall(ident, returnType, argTypes, arguments, opts);
    }
  }
  
  /** @type {function(number, number, string, boolean=)} */
  function setValue(ptr, value, type, noSafe) {
    type = type || 'i8';
    if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
      switch(type) {
        case 'i1': HEAP8[((ptr)>>0)]=value; break;
        case 'i8': HEAP8[((ptr)>>0)]=value; break;
        case 'i16': HEAP16[((ptr)>>1)]=value; break;
        case 'i32': HEAP32[((ptr)>>2)]=value; break;
        case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
        case 'float': HEAPF32[((ptr)>>2)]=value; break;
        case 'double': HEAPF64[((ptr)>>3)]=value; break;
        default: abort('invalid type for setValue: ' + type);
      }
  }
  
  var ALLOC_NORMAL = 0; // Tries to use _malloc()
  var ALLOC_STACK = 1; // Lives for the duration of the current function call
  var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
  var ALLOC_NONE = 3; // Do not allocate
  
  // allocate(): This is for internal use. You can use it yourself as well, but the interface
  //             is a little tricky (see docs right below). The reason is that it is optimized
  //             for multiple syntaxes to save space in generated code. So you should
  //             normally not use allocate(), and instead allocate memory using _malloc(),
  //             initialize it with setValue(), and so forth.
  // @slab: An array of data, or a number. If a number, then the size of the block to allocate,
  //        in *bytes* (note that this is sometimes confusing: the next parameter does not
  //        affect this!)
  // @types: Either an array of types, one for each byte (or 0 if no type at that position),
  //         or a single type which is used for the entire block. This only matters if there
  //         is initial data - if @slab is a number, then this does not matter at all and is
  //         ignored.
  // @allocator: How to allocate memory, see ALLOC_*
  /** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
  function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === 'number') {
      zeroinit = true;
      size = slab;
    } else {
      zeroinit = false;
      size = slab.length;
    }
  
    var singleType = typeof types === 'string' ? types : null;
  
    var ret;
    if (allocator == ALLOC_NONE) {
      ret = ptr;
    } else {
      ret = [_malloc,
      stackAlloc,
      dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
    }
  
    if (zeroinit) {
      var stop;
      ptr = ret;
      assert((ret & 3) == 0);
      stop = ret + (size & ~3);
      for (; ptr < stop; ptr += 4) {
        HEAP32[((ptr)>>2)]=0;
      }
      stop = ret + size;
      while (ptr < stop) {
        HEAP8[((ptr++)>>0)]=0;
      }
      return ret;
    }
  
    if (singleType === 'i8') {
      if (slab.subarray || slab.slice) {
        HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
      } else {
        HEAPU8.set(new Uint8Array(slab), ret);
      }
      return ret;
    }
  
    var i = 0, type, typeSize, previousType;
    while (i < size) {
      var curr = slab[i];
  
      type = singleType || types[i];
      if (type === 0) {
        i++;
        continue;
      }
      assert(type, 'Must know what type to store in allocate!');
  
      if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
  
      setValue(ret+i, curr, type);
  
      // no need to look up size unless type changes, so cache it
      if (previousType !== type) {
        typeSize = getNativeTypeSize(type);
        previousType = type;
      }
      i += typeSize;
    }
  
    return ret;
  }
  
  // Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
  function getMemory(size) {
    if (!runtimeInitialized) return dynamicAlloc(size);
    return _malloc(size);
  }
  
  
  
  
  /** @type {function(number, number=)} */
  function Pointer_stringify(ptr, length) {
    abort("this function has been removed - you should use UTF8ToString(ptr, maxBytesToRead) instead!");
  }
  
  // Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
  // a copy of that string as a Javascript String object.
  
  function AsciiToString(ptr) {
    var str = '';
    while (1) {
      var ch = HEAPU8[((ptr++)>>0)];
      if (!ch) return str;
      str += String.fromCharCode(ch);
    }
  }
  
  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.
  
  function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
  }
  
  
  // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
  // a copy of that string as a Javascript String object.
  
  var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
  
  /**
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @return {string}
   */
  function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
    while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
    } else {
      var str = '';
      // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = u8Array[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = u8Array[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = u8Array[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
    }
    return str;
  }
  
  // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
  // copy of that string as a Javascript String object.
  // maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
  //                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
  //                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
  //                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
  //                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
  //                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
  //                 throw JS JIT optimizations off, so it is worth to consider consistently using one
  //                 style or the other.
  /**
   * @param {number} ptr
   * @param {number=} maxBytesToRead
   * @return {string}
   */
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
  }
  
  // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
  // encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
  // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
  //   outIdx: The starting offset in the array to begin the copying.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array.
  //                    This count should include the null terminator,
  //                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.
  
  function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
      return 0;
  
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      var u = str.charCodeAt(i); // possibly a lead surrogate
      if (u >= 0xD800 && u <= 0xDFFF) {
        var u1 = str.charCodeAt(++i);
        u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
      }
      if (u <= 0x7F) {
        if (outIdx >= endIdx) break;
        outU8Array[outIdx++] = u;
      } else if (u <= 0x7FF) {
        if (outIdx + 1 >= endIdx) break;
        outU8Array[outIdx++] = 0xC0 | (u >> 6);
        outU8Array[outIdx++] = 0x80 | (u & 63);
      } else if (u <= 0xFFFF) {
        if (outIdx + 2 >= endIdx) break;
        outU8Array[outIdx++] = 0xE0 | (u >> 12);
        outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
        outU8Array[outIdx++] = 0x80 | (u & 63);
      } else {
        if (outIdx + 3 >= endIdx) break;
        if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
        outU8Array[outIdx++] = 0xF0 | (u >> 18);
        outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
        outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
        outU8Array[outIdx++] = 0x80 | (u & 63);
      }
    }
    // Null-terminate the pointer to the buffer.
    outU8Array[outIdx] = 0;
    return outIdx - startIdx;
  }
  
  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
  // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Returns the number of bytes written, EXCLUDING the null terminator.
  
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
  }
  
  // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
  function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var u = str.charCodeAt(i); // possibly a lead surrogate
      if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
      if (u <= 0x7F) ++len;
      else if (u <= 0x7FF) len += 2;
      else if (u <= 0xFFFF) len += 3;
      else len += 4;
    }
    return len;
  }
  
  
  // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
  // a copy of that string as a Javascript String object.
  
  var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr) {
    assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
    var endPtr = ptr;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    var idx = endPtr >> 1;
    while (HEAP16[idx]) ++idx;
    endPtr = idx << 1;
  
    if (endPtr - ptr > 32 && UTF16Decoder) {
      return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    } else {
      var i = 0;
  
      var str = '';
      while (1) {
        var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit == 0) return str;
        ++i;
        // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
        str += String.fromCharCode(codeUnit);
      }
    }
  }
  
  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
  // Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   outPtr: Byte address in Emscripten HEAP where to write the string to.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
  //                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.
  
  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2; // Null terminator.
    var startPtr = outPtr;
    var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
      // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
      var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
      HEAP16[((outPtr)>>1)]=codeUnit;
      outPtr += 2;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP16[((outPtr)>>1)]=0;
    return outPtr - startPtr;
  }
  
  // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.
  
  function lengthBytesUTF16(str) {
    return str.length*2;
  }
  
  function UTF32ToString(ptr) {
    assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
    var i = 0;
  
    var str = '';
    while (1) {
      var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
      if (utf32 == 0)
        return str;
      ++i;
      // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      if (utf32 >= 0x10000) {
        var ch = utf32 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      } else {
        str += String.fromCharCode(utf32);
      }
    }
  }
  
  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
  // Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   outPtr: Byte address in Emscripten HEAP where to write the string to.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
  //                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.
  
  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 4) return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
      if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
        var trailSurrogate = str.charCodeAt(++i);
        codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
      }
      HEAP32[((outPtr)>>2)]=codeUnit;
      outPtr += 4;
      if (outPtr + 4 > endPtr) break;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP32[((outPtr)>>2)]=0;
    return outPtr - startPtr;
  }
  
  // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.
  
  function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
      len += 4;
    }
  
    return len;
  }
  
  // Allocate heap space for a JS string, and write it there.
  // It is the responsibility of the caller to free() that memory.
  function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  
  // Allocate stack space for a JS string, and write it there.
  function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  
  // Deprecated: This function should not be called because it is unsafe and does not provide
  // a maximum length limit of how many bytes it is allowed to write. Prefer calling the
  // function stringToUTF8Array() instead, which takes in a maximum length that can be used
  // to be secure from out of bounds writes.
  /** @deprecated */
  function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
  
    var /** @type {number} */ lastChar, /** @type {number} */ end;
    if (dontAddNull) {
      // stringToUTF8Array always appends null. If we don't want to do that, remember the
      // character that existed at the location where the null will be placed, and restore
      // that after the write (below).
      end = buffer + lengthBytesUTF8(string);
      lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
  }
  
  function writeArrayToMemory(array, buffer) {
    assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
    HEAP8.set(array, buffer);
  }
  
  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
      assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
      HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
    }
    // Null-terminate the pointer to the HEAP.
    if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
  }
  
  
  
  
  
  function demangle(func) {
    warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
    return func;
  }
  
  function demangleAll(text) {
    var regex =
      /__Z[\w\d_]+/g;
    return text.replace(regex,
      function(x) {
        var y = demangle(x);
        return x === y ? x : (y + ' [' + x + ']');
      });
  }
  
  function jsStackTrace() {
    var err = new Error();
    if (!err.stack) {
      // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
      // so try that as a special-case.
      try {
        throw new Error(0);
      } catch(e) {
        err = e;
      }
      if (!err.stack) {
        return '(no stack trace available)';
      }
    }
    return err.stack.toString();
  }
  
  function stackTrace() {
    var js = jsStackTrace();
    if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
    return demangleAll(js);
  }
  
  
  
  // Memory management
  
  var PAGE_SIZE = 16384;
  var WASM_PAGE_SIZE = 65536;
  var ASMJS_PAGE_SIZE = 16777216;
  
  function alignUp(x, multiple) {
    if (x % multiple > 0) {
      x += multiple - (x % multiple);
    }
    return x;
  }
  
  var HEAP,
  /** @type {ArrayBuffer} */
    buffer,
  /** @type {Int8Array} */
    HEAP8,
  /** @type {Uint8Array} */
    HEAPU8,
  /** @type {Int16Array} */
    HEAP16,
  /** @type {Uint16Array} */
    HEAPU16,
  /** @type {Int32Array} */
    HEAP32,
  /** @type {Uint32Array} */
    HEAPU32,
  /** @type {Float32Array} */
    HEAPF32,
  /** @type {Float64Array} */
    HEAPF64;
  
  function updateGlobalBufferViews() {
    Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
    Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
    Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
  }
  
  
  var STATIC_BASE = 1024,
      STACK_BASE = 287168,
      STACKTOP = STACK_BASE,
      STACK_MAX = 5530048,
      DYNAMIC_BASE = 5530048,
      DYNAMICTOP_PTR = 286912;
  
  assert(STACK_BASE % 16 === 0, 'stack must start aligned');
  assert(DYNAMIC_BASE % 16 === 0, 'heap must start aligned');
  
  
  
  var TOTAL_STACK = 5242880;
  if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')
  
  var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
  if (INITIAL_TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');
  
  // Initialize the runtime's memory
  // check for full engine support (use string 'subarray' to avoid closure compiler confusion)
  assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
         'JS engine does not provide full typed array support');
  
  
  
  
  
  
  
  // Use a provided buffer, if there is one, or else allocate a new one
  if (Module['buffer']) {
    buffer = Module['buffer'];
    assert(buffer.byteLength === INITIAL_TOTAL_MEMORY, 'provided buffer should be ' + INITIAL_TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
  } else {
    // Use a WebAssembly memory where available
    if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
      assert(INITIAL_TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
      wasmMemory = new WebAssembly.Memory({ 'initial': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE });
      buffer = wasmMemory.buffer;
    } else
    {
      buffer = new ArrayBuffer(INITIAL_TOTAL_MEMORY);
    }
    assert(buffer.byteLength === INITIAL_TOTAL_MEMORY);
  }
  updateGlobalBufferViews();
  
  
  HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;
  
  
  // Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
  function writeStackCookie() {
    assert((STACK_MAX & 3) == 0);
    HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
    HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
  }
  
  function checkStackCookie() {
    if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
      abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
    }
    // Also test the global address 0 for integrity.
    if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
  }
  
  function abortStackOverflow(allocSize) {
    abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
  }
  
  
    HEAP32[0] = 0x63736d65; /* 'emsc' */
  
  
  
  // Endianness check (note: assumes compiler arch was little-endian)
  HEAP16[1] = 0x6373;
  if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';
  
  function callRuntimeCallbacks(callbacks) {
    while(callbacks.length > 0) {
      var callback = callbacks.shift();
      if (typeof callback == 'function') {
        callback();
        continue;
      }
      var func = callback.func;
      if (typeof func === 'number') {
        if (callback.arg === undefined) {
          Module['dynCall_v'](func);
        } else {
          Module['dynCall_vi'](func, callback.arg);
        }
      } else {
        func(callback.arg === undefined ? null : callback.arg);
      }
    }
  }
  
  var __ATPRERUN__  = []; // functions called before the runtime is initialized
  var __ATINIT__    = []; // functions called during startup
  var __ATMAIN__    = []; // functions called when main() is to be run
  var __ATEXIT__    = []; // functions called during shutdown
  var __ATPOSTRUN__ = []; // functions called after the main() is called
  
  var runtimeInitialized = false;
  var runtimeExited = false;
  
  
  function preRun() {
    // compatibility - merge in anything from Module['preRun'] at this time
    if (Module['preRun']) {
      if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
      while (Module['preRun'].length) {
        addOnPreRun(Module['preRun'].shift());
      }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  
  function ensureInitRuntime() {
    checkStackCookie();
    if (runtimeInitialized) return;
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
  TTY.init();
    callRuntimeCallbacks(__ATINIT__);
  }
  
  function preMain() {
    checkStackCookie();
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__);
  }
  
  function exitRuntime() {
    checkStackCookie();
    runtimeExited = true;
  }
  
  function postRun() {
    checkStackCookie();
    // compatibility - merge in anything from Module['postRun'] at this time
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length) {
        addOnPostRun(Module['postRun'].shift());
      }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  
  function addOnInit(cb) {
    __ATINIT__.unshift(cb);
  }
  
  function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
  }
  
  function addOnExit(cb) {
  }
  
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }
  
  function unSign(value, bits, ignore) {
    if (value >= 0) {
      return value;
    }
    return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                      : Math.pow(2, bits)         + value;
  }
  function reSign(value, bits, ignore) {
    if (value <= 0) {
      return value;
    }
    var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                          : Math.pow(2, bits-1);
    if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                         // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                         // TODO: In i64 mode 1, resign the two parts separately and safely
      value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
    }
    return value;
  }
  
  
  assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  
  var Math_abs = Math.abs;
  var Math_cos = Math.cos;
  var Math_sin = Math.sin;
  var Math_tan = Math.tan;
  var Math_acos = Math.acos;
  var Math_asin = Math.asin;
  var Math_atan = Math.atan;
  var Math_atan2 = Math.atan2;
  var Math_exp = Math.exp;
  var Math_log = Math.log;
  var Math_sqrt = Math.sqrt;
  var Math_ceil = Math.ceil;
  var Math_floor = Math.floor;
  var Math_pow = Math.pow;
  var Math_imul = Math.imul;
  var Math_fround = Math.fround;
  var Math_round = Math.round;
  var Math_min = Math.min;
  var Math_max = Math.max;
  var Math_clz32 = Math.clz32;
  var Math_trunc = Math.trunc;
  
  
  
  // A counter of dependencies for calling run(). If we need to
  // do asynchronous work before running, increment this and
  // decrement it. Incrementing must happen in a place like
  // Module.preRun (used by emcc to add file preloading).
  // Note that you can add dependencies in preRun, even though
  // it happens right before run - run will be postponed until
  // the dependencies are met.
  var runDependencies = 0;
  var runDependencyWatcher = null;
  var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
  var runDependencyTracking = {};
  
  function getUniqueRunDependency(id) {
    var orig = id;
    while (1) {
      if (!runDependencyTracking[id]) return id;
      id = orig + Math.random();
    }
    return id;
  }
  
  function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
      Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
      assert(!runDependencyTracking[id]);
      runDependencyTracking[id] = 1;
      if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
        // Check for missing dependencies every few seconds
        runDependencyWatcher = setInterval(function() {
          if (ABORT) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
            return;
          }
          var shown = false;
          for (var dep in runDependencyTracking) {
            if (!shown) {
              shown = true;
              err('still waiting on run dependencies:');
            }
            err('dependency: ' + dep);
          }
          if (shown) {
            err('(end of list)');
          }
        }, 10000);
      }
    } else {
      err('warning: run dependency added without ID');
    }
  }
  
  function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
      Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
      assert(runDependencyTracking[id]);
      delete runDependencyTracking[id];
    } else {
      err('warning: run dependency removed without ID');
    }
    if (runDependencies == 0) {
      if (runDependencyWatcher !== null) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
      }
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback(); // can add another dependenciesFulfilled
      }
    }
  }
  
  Module["preloadedImages"] = {}; // maps url to image data
  Module["preloadedAudios"] = {}; // maps url to audio data
  
  
  var memoryInitializer = null;
  
  
  
  
  
  
  // Copyright 2017 The Emscripten Authors.  All rights reserved.
  // Emscripten is available under two separate licenses, the MIT license and the
  // University of Illinois/NCSA Open Source License.  Both these licenses can be
  // found in the LICENSE file.
  
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  var dataURIPrefix = 'data:application/octet-stream;base64,';
  
  // Indicates whether filename is a base64 data URI.
  function isDataURI(filename) {
    return String.prototype.startsWith ?
        filename.startsWith(dataURIPrefix) :
        filename.indexOf(dataURIPrefix) === 0;
  }
  
  
  
  
  var wasmBinaryFile = 'rhino3dm.wasm';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  
  function getBinary() {
    try {
      if (Module['wasmBinary']) {
        return new Uint8Array(Module['wasmBinary']);
      }
      if (Module['readBinary']) {
        return Module['readBinary'](wasmBinaryFile);
      } else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
      abort(err);
    }
  }
  
  function getBinaryPromise() {
    // if we don't have the binary yet, and have the Fetch api, use that
    // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
    if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
        return getBinary();
      });
    }
    // Otherwise, getBinary should be able to get it synchronously
    return new Promise(function(resolve, reject) {
      resolve(getBinary());
    });
  }
  
  // Create the wasm instance.
  // Receives the wasm imports, returns the exports.
  function createWasm(env) {
    // prepare imports
    var info = {
      'env': env
      ,
      'global': {
        'NaN': NaN,
        'Infinity': Infinity
      },
      'global.Math': Math,
      'asm2wasm': asm2wasmImports
    };
    // Load the wasm module and create an instance of using native support in the JS engine.
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    function receiveInstance(instance, module) {
      var exports = instance.exports;
      Module['asm'] = exports;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');
  
    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
      try {
        return Module['instantiateWasm'](info, receiveInstance);
      } catch(e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }
  
    // Async compilation can be confusing when an error on the page overwrites Module
    // (for example, if the order of elements is wrong, and the one defining Module is
    // later), so we save Module and check it later.
    var trueModule = Module;
    function receiveInstantiatedSource(output) {
      // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
      // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
      trueModule = null;
        // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
        // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
      receiveInstance(output['instance']);
    }
    function instantiateArrayBuffer(receiver) {
      getBinaryPromise().then(function(binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver, function(reason) {
        err('failed to asynchronously prepare wasm: ' + reason);
        abort(reason);
      });
    }
    // Prefer streaming instantiation if available.
    if (!Module['wasmBinary'] &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
        .then(receiveInstantiatedSource, function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err('wasm streaming compile failed: ' + reason);
          err('falling back to ArrayBuffer instantiation');
          instantiateArrayBuffer(receiveInstantiatedSource);
        });
    } else {
      instantiateArrayBuffer(receiveInstantiatedSource);
    }
    return {}; // no exports yet; we'll fill them in later
  }
  
  // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
  // the wasm module at that time, and it receives imports and provides exports and so forth, the app
  // doesn't need to care that it is wasm or asm.js.
  
  Module['asm'] = function(global, env, providedBuffer) {
    // memory was already allocated (so js could use the buffer)
    env['memory'] = wasmMemory
    ;
    // import table
    env['table'] = wasmTable = new WebAssembly.Table({
      'initial': 365824,
      'maximum': 365824,
      'element': 'anyfunc'
    });
    env['__memory_base'] = 1024; // tell the memory segments where to place themselves
    env['__table_base'] = 0; // table starts at 0 by default (even in dynamic linking, for the main module)
  
    var exports = createWasm(env);
    assert(exports, 'binaryen setup failed (no wasm support?)');
    return exports;
  };
  
  // === Body ===
  
  var ASM_CONSTS = [];
  
  
  
  
  
  // STATICTOP = STATIC_BASE + 286144;
  /* global initializers */  __ATINIT__.push({ func: function() { globalCtors() } });
  
  
  
  
  
  
  
  
  /* no memory initializer */
  var tempDoublePtr = 287152
  assert(tempDoublePtr % 8 == 0);
  
  function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
    HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
    HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  }
  
  function copyTempDouble(ptr) {
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
    HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
    HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
    HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
    HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
    HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
    HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
  }
  
  // {{PRE_LIBRARY}}
  
  
    function ___cxa_allocate_exception(size) {
        return _malloc(size);
      }
  
    
    function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
        return !!__ZSt18uncaught_exceptionv.uncaught_exception;
      }
    
    
    function ___cxa_free_exception(ptr) {
        try {
          return _free(ptr);
        } catch(e) { // XXX FIXME
          err('exception during cxa_free_exception: ' + e);
        }
      }var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:function (adjusted) {
          if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
          for (var key in EXCEPTIONS.infos) {
            var ptr = +key; // the iteration key is a string, and if we throw this, it must be an integer as that is what we look for
            var adj = EXCEPTIONS.infos[ptr].adjusted;
            var len = adj.length;
            for (var i = 0; i < len; i++) {
              if (adj[i] === adjusted) {
                return ptr;
              }
            }
          }
          return adjusted;
        },addRef:function (ptr) {
          if (!ptr) return;
          var info = EXCEPTIONS.infos[ptr];
          info.refcount++;
        },decRef:function (ptr) {
          if (!ptr) return;
          var info = EXCEPTIONS.infos[ptr];
          assert(info.refcount > 0);
          info.refcount--;
          // A rethrown exception can reach refcount 0; it must not be discarded
          // Its next handler will clear the rethrown flag and addRef it, prior to
          // final decRef and destruction here
          if (info.refcount === 0 && !info.rethrown) {
            if (info.destructor) {
              Module['dynCall_vi'](info.destructor, ptr);
            }
            delete EXCEPTIONS.infos[ptr];
            ___cxa_free_exception(ptr);
          }
        },clearRef:function (ptr) {
          if (!ptr) return;
          var info = EXCEPTIONS.infos[ptr];
          info.refcount = 0;
        }};function ___cxa_begin_catch(ptr) {
        var info = EXCEPTIONS.infos[ptr];
        if (info && !info.caught) {
          info.caught = true;
          __ZSt18uncaught_exceptionv.uncaught_exception--;
        }
        if (info) info.rethrown = false;
        EXCEPTIONS.caught.push(ptr);
        EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
        return ptr;
      }
  
    function ___cxa_pure_virtual() {
        ABORT = true;
        throw 'Pure virtual function called!';
      }
  
    
    
    function ___resumeException(ptr) {
        if (!EXCEPTIONS.last) { EXCEPTIONS.last = ptr; }
        throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
      }function ___cxa_find_matching_catch() {
        var thrown = EXCEPTIONS.last;
        if (!thrown) {
          // just pass through the null ptr
          return ((setTempRet0(0),0)|0);
        }
        var info = EXCEPTIONS.infos[thrown];
        var throwntype = info.type;
        if (!throwntype) {
          // just pass through the thrown ptr
          return ((setTempRet0(0),thrown)|0);
        }
        var typeArray = Array.prototype.slice.call(arguments);
    
        var pointer = Module['___cxa_is_pointer_type'](throwntype);
        // can_catch receives a **, add indirection
        if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
        HEAP32[((___cxa_find_matching_catch.buffer)>>2)]=thrown;
        thrown = ___cxa_find_matching_catch.buffer;
        // The different catch blocks are denoted by different types.
        // Due to inheritance, those types may not precisely match the
        // type of the thrown object. Find one which matches, and
        // return the type of the catch block which should be called.
        for (var i = 0; i < typeArray.length; i++) {
          if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[((thrown)>>2)]; // undo indirection
            info.adjusted.push(thrown);
            return ((setTempRet0(typeArray[i]),thrown)|0);
          }
        }
        // Shouldn't happen unless we have bogus data in typeArray
        // or encounter a type for which emscripten doesn't have suitable
        // typeinfo defined. Best-efforts match just in case.
        thrown = HEAP32[((thrown)>>2)]; // undo indirection
        return ((setTempRet0(throwntype),thrown)|0);
      }function ___cxa_throw(ptr, type, destructor) {
        EXCEPTIONS.infos[ptr] = {
          ptr: ptr,
          adjusted: [ptr],
          type: type,
          destructor: destructor,
          refcount: 0,
          caught: false,
          rethrown: false
        };
        EXCEPTIONS.last = ptr;
        if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
          __ZSt18uncaught_exceptionv.uncaught_exception = 1;
        } else {
          __ZSt18uncaught_exceptionv.uncaught_exception++;
        }
        throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
      }
  
    function ___gxx_personality_v0() {
      }
  
    function ___lock() {}
  
    
    
    
    function ___setErrNo(value) {
        if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
        else err('failed to set errno from JS');
        return value;
      }
    
    var PATH={splitPath:function (filename) {
          var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
          return splitPathRe.exec(filename).slice(1);
        },normalizeArray:function (parts, allowAboveRoot) {
          // if the path tries to go above the root, `up` ends up > 0
          var up = 0;
          for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === '.') {
              parts.splice(i, 1);
            } else if (last === '..') {
              parts.splice(i, 1);
              up++;
            } else if (up) {
              parts.splice(i, 1);
              up--;
            }
          }
          // if the path is allowed to go above the root, restore leading ..s
          if (allowAboveRoot) {
            for (; up; up--) {
              parts.unshift('..');
            }
          }
          return parts;
        },normalize:function (path) {
          var isAbsolute = path.charAt(0) === '/',
              trailingSlash = path.substr(-1) === '/';
          // Normalize the path
          path = PATH.normalizeArray(path.split('/').filter(function(p) {
            return !!p;
          }), !isAbsolute).join('/');
          if (!path && !isAbsolute) {
            path = '.';
          }
          if (path && trailingSlash) {
            path += '/';
          }
          return (isAbsolute ? '/' : '') + path;
        },dirname:function (path) {
          var result = PATH.splitPath(path),
              root = result[0],
              dir = result[1];
          if (!root && !dir) {
            // No dirname whatsoever
            return '.';
          }
          if (dir) {
            // It has a dirname, strip trailing slash
            dir = dir.substr(0, dir.length - 1);
          }
          return root + dir;
        },basename:function (path) {
          // EMSCRIPTEN return '/'' for '/', not an empty string
          if (path === '/') return '/';
          var lastSlash = path.lastIndexOf('/');
          if (lastSlash === -1) return path;
          return path.substr(lastSlash+1);
        },extname:function (path) {
          return PATH.splitPath(path)[3];
        },join:function () {
          var paths = Array.prototype.slice.call(arguments, 0);
          return PATH.normalize(paths.join('/'));
        },join2:function (l, r) {
          return PATH.normalize(l + '/' + r);
        },resolve:function () {
          var resolvedPath = '',
            resolvedAbsolute = false;
          for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = (i >= 0) ? arguments[i] : FS.cwd();
            // Skip empty and invalid entries
            if (typeof path !== 'string') {
              throw new TypeError('Arguments to path.resolve must be strings');
            } else if (!path) {
              return ''; // an invalid portion invalidates the whole thing
            }
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charAt(0) === '/';
          }
          // At this point the path should be resolved to a full absolute path, but
          // handle relative paths to be safe (might happen when process.cwd() fails)
          resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
            return !!p;
          }), !resolvedAbsolute).join('/');
          return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
        },relative:function (from, to) {
          from = PATH.resolve(from).substr(1);
          to = PATH.resolve(to).substr(1);
          function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
              if (arr[start] !== '') break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
              if (arr[end] !== '') break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
          }
          var fromParts = trim(from.split('/'));
          var toParts = trim(to.split('/'));
          var length = Math.min(fromParts.length, toParts.length);
          var samePartsLength = length;
          for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
              samePartsLength = i;
              break;
            }
          }
          var outputParts = [];
          for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push('..');
          }
          outputParts = outputParts.concat(toParts.slice(samePartsLength));
          return outputParts.join('/');
        }};
    
    var TTY={ttys:[],init:function () {
          // https://github.com/emscripten-core/emscripten/pull/1555
          // if (ENVIRONMENT_IS_NODE) {
          //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
          //   // device, it always assumes it's a TTY device. because of this, we're forcing
          //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
          //   // with text files until FS.init can be refactored.
          //   process['stdin']['setEncoding']('utf8');
          // }
        },shutdown:function () {
          // https://github.com/emscripten-core/emscripten/pull/1555
          // if (ENVIRONMENT_IS_NODE) {
          //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
          //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
          //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
          //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
          //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
          //   process['stdin']['pause']();
          // }
        },register:function (dev, ops) {
          TTY.ttys[dev] = { input: [], output: [], ops: ops };
          FS.registerDevice(dev, TTY.stream_ops);
        },stream_ops:{open:function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
              throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            stream.tty = tty;
            stream.seekable = false;
          },close:function (stream) {
            // flush any pending line data
            stream.tty.ops.flush(stream.tty);
          },flush:function (stream) {
            stream.tty.ops.flush(stream.tty);
          },read:function (stream, buffer, offset, length, pos /* ignored */) {
            if (!stream.tty || !stream.tty.ops.get_char) {
              throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = stream.tty.ops.get_char(stream.tty);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },write:function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
              throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
            }
            try {
              for (var i = 0; i < length; i++) {
                stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
              }
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }},default_tty_ops:{get_char:function (tty) {
            if (!tty.input.length) {
              var result = null;
              if (ENVIRONMENT_IS_NODE) {
                // we will read data by chunks of BUFSIZE
                var BUFSIZE = 256;
                var buf = new Buffer(BUFSIZE);
                var bytesRead = 0;
    
                var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion
    
                var fd = process.stdin.fd;
                if (isPosixPlatform) {
                  // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                  var usingDevice = false;
                  try {
                    fd = fs.openSync('/dev/stdin', 'r');
                    usingDevice = true;
                  } catch (e) {}
                }
    
                try {
                  bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
                } catch(e) {
                  // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                  // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                  if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                  else throw e;
                }
    
                if (usingDevice) { fs.closeSync(fd); }
                if (bytesRead > 0) {
                  result = buf.slice(0, bytesRead).toString('utf-8');
                } else {
                  result = null;
                }
              } else
              if (typeof window != 'undefined' &&
                typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');  // returns null on cancel
                if (result !== null) {
                  result += '\n';
                }
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
                if (result !== null) {
                  result += '\n';
                }
              }
              if (!result) {
                return null;
              }
              tty.input = intArrayFromString(result, true);
            }
            return tty.input.shift();
          },put_char:function (tty, val) {
            if (val === null || val === 10) {
              out(UTF8ArrayToString(tty.output, 0));
              tty.output = [];
            } else {
              if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
            }
          },flush:function (tty) {
            if (tty.output && tty.output.length > 0) {
              out(UTF8ArrayToString(tty.output, 0));
              tty.output = [];
            }
          }},default_tty1_ops:{put_char:function (tty, val) {
            if (val === null || val === 10) {
              err(UTF8ArrayToString(tty.output, 0));
              tty.output = [];
            } else {
              if (val != 0) tty.output.push(val);
            }
          },flush:function (tty) {
            if (tty.output && tty.output.length > 0) {
              err(UTF8ArrayToString(tty.output, 0));
              tty.output = [];
            }
          }}};
    
    var MEMFS={ops_table:null,mount:function (mount) {
          return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
        },createNode:function (parent, name, mode, dev) {
          if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            // no supported
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          }
          if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
              dir: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr,
                  lookup: MEMFS.node_ops.lookup,
                  mknod: MEMFS.node_ops.mknod,
                  rename: MEMFS.node_ops.rename,
                  unlink: MEMFS.node_ops.unlink,
                  rmdir: MEMFS.node_ops.rmdir,
                  readdir: MEMFS.node_ops.readdir,
                  symlink: MEMFS.node_ops.symlink
                },
                stream: {
                  llseek: MEMFS.stream_ops.llseek
                }
              },
              file: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr
                },
                stream: {
                  llseek: MEMFS.stream_ops.llseek,
                  read: MEMFS.stream_ops.read,
                  write: MEMFS.stream_ops.write,
                  allocate: MEMFS.stream_ops.allocate,
                  mmap: MEMFS.stream_ops.mmap,
                  msync: MEMFS.stream_ops.msync
                }
              },
              link: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr,
                  readlink: MEMFS.node_ops.readlink
                },
                stream: {}
              },
              chrdev: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr
                },
                stream: FS.chrdev_stream_ops
              }
            };
          }
          var node = FS.createNode(parent, name, mode, dev);
          if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
          } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
            // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
            // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
            // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
            node.contents = null; 
          } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
          } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
          }
          node.timestamp = Date.now();
          // add the new node to the parent
          if (parent) {
            parent.contents[name] = node;
          }
          return node;
        },getFileDataAsRegularArray:function (node) {
          if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr; // Returns a copy of the original data.
          }
          return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
        },getFileDataAsTypedArray:function (node) {
          if (!node.contents) return new Uint8Array;
          if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
          return new Uint8Array(node.contents);
        },expandFileStorage:function (node, newCapacity) {
          var prevCapacity = node.contents ? node.contents.length : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        },resizeFileStorage:function (node, newSize) {
          if (node.usedBytes == newSize) return;
          if (newSize == 0) {
            node.contents = null; // Fully decommit when requesting a resize to zero.
            node.usedBytes = 0;
            return;
          }
          if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
            if (oldContents) {
              node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
            }
            node.usedBytes = newSize;
            return;
          }
          // Backing with a JS array.
          if (!node.contents) node.contents = [];
          if (node.contents.length > newSize) node.contents.length = newSize;
          else while (node.contents.length < newSize) node.contents.push(0);
          node.usedBytes = newSize;
        },node_ops:{getattr:function (node) {
            var attr = {};
            // device numbers reuse inode numbers.
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
              attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
              attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
              attr.size = node.link.length;
            } else {
              attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
            //       but this is not required by the standard.
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
          },setattr:function (node, attr) {
            if (attr.mode !== undefined) {
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
              MEMFS.resizeFileStorage(node, attr.size);
            }
          },lookup:function (parent, name) {
            throw FS.genericErrors[ERRNO_CODES.ENOENT];
          },mknod:function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
          },rename:function (old_node, new_dir, new_name) {
            // if we're overwriting a directory at new_name, make sure it's empty.
            if (FS.isDir(old_node.mode)) {
              var new_node;
              try {
                new_node = FS.lookupNode(new_dir, new_name);
              } catch (e) {
              }
              if (new_node) {
                for (var i in new_node.contents) {
                  throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
                }
              }
            }
            // do the internal rewiring
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir;
          },unlink:function (parent, name) {
            delete parent.contents[name];
          },rmdir:function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
            }
            delete parent.contents[name];
          },readdir:function (node) {
            var entries = ['.', '..']
            for (var key in node.contents) {
              if (!node.contents.hasOwnProperty(key)) {
                continue;
              }
              entries.push(key);
            }
            return entries;
          },symlink:function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
            node.link = oldpath;
            return node;
          },readlink:function (node) {
            if (!FS.isLink(node.mode)) {
              throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return node.link;
          }},stream_ops:{read:function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) { // non-trivial, and typed array
              buffer.set(contents.subarray(position, position + size), offset);
            } else {
              for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
            }
            return size;
          },write:function (stream, buffer, offset, length, position, canOwn) {
            // If memory can grow, we don't want to hold on to references of
            // the memory Buffer, as they may get invalidated. That means
            // we need to do a copy here.
            // FIXME: this is inefficient as the file packager may have
            //        copied the data into memory already - we may want to
            //        integrate more there and let the file packager loading
            //        code be able to query if memory growth is on or off.
            if (canOwn) {
              warnOnce('file packager has copied file data into memory, but in memory growth we are forced to copy it again (see --no-heap-copy)');
            }
            canOwn = false;
    
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
    
            if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
              if (canOwn) {
                assert(position === 0, 'canOwn must imply no weird position inside the file');
                node.contents = buffer.subarray(offset, offset + length);
                node.usedBytes = length;
                return length;
              } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
                node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                node.usedBytes = length;
                return length;
              } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
                node.contents.set(buffer.subarray(offset, offset + length), position);
                return length;
              }
            }
    
            // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
            MEMFS.expandFileStorage(node, position+length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
            else {
              for (var i = 0; i < length; i++) {
               node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
              }
            }
            node.usedBytes = Math.max(node.usedBytes, position+length);
            return length;
          },llseek:function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {  // SEEK_CUR.
              position += stream.position;
            } else if (whence === 2) {  // SEEK_END.
              if (FS.isFile(stream.node.mode)) {
                position += stream.node.usedBytes;
              }
            }
            if (position < 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return position;
          },allocate:function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
          },mmap:function (stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
              throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            // Only make a new copy when MAP_PRIVATE is specified.
            if ( !(flags & 2) &&
                  (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
              // We can't emulate MAP_SHARED when the file is not backed by the buffer
              // we're mapping to (e.g. the HEAP buffer).
              allocated = false;
              ptr = contents.byteOffset;
            } else {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < stream.node.usedBytes) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              allocated = true;
              ptr = _malloc(length);
              if (!ptr) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
              }
              buffer.set(contents, ptr);
            }
            return { ptr: ptr, allocated: allocated };
          },msync:function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
              throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            if (mmapFlags & 2) {
              // MAP_PRIVATE calls need not to be synced back to underlying fs
              return 0;
            }
    
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            // should we check if bytesWritten and length are the same?
            return 0;
          }}};
    
    var IDBFS={dbs:{},indexedDB:function () {
          if (typeof indexedDB !== 'undefined') return indexedDB;
          var ret = null;
          if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
          assert(ret, 'IDBFS used, but indexedDB not supported');
          return ret;
        },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
          // reuse all of the core MEMFS functionality
          return MEMFS.mount.apply(null, arguments);
        },syncfs:function (mount, populate, callback) {
          IDBFS.getLocalSet(mount, function(err, local) {
            if (err) return callback(err);
    
            IDBFS.getRemoteSet(mount, function(err, remote) {
              if (err) return callback(err);
    
              var src = populate ? remote : local;
              var dst = populate ? local : remote;
    
              IDBFS.reconcile(src, dst, callback);
            });
          });
        },getDB:function (name, callback) {
          // check the cache first
          var db = IDBFS.dbs[name];
          if (db) {
            return callback(null, db);
          }
    
          var req;
          try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
          } catch (e) {
            return callback(e);
          }
          if (!req) {
            return callback("Unable to connect to IndexedDB");
          }
          req.onupgradeneeded = function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
    
            var fileStore;
    
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
              fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
            } else {
              fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
            }
    
            if (!fileStore.indexNames.contains('timestamp')) {
              fileStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
          };
          req.onsuccess = function() {
            db = req.result;
    
            // add to the cache
            IDBFS.dbs[name] = db;
            callback(null, db);
          };
          req.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
        },getLocalSet:function (mount, callback) {
          var entries = {};
    
          function isRealDir(p) {
            return p !== '.' && p !== '..';
          };
          function toAbsolute(root) {
            return function(p) {
              return PATH.join2(root, p);
            }
          };
    
          var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
    
          while (check.length) {
            var path = check.pop();
            var stat;
    
            try {
              stat = FS.stat(path);
            } catch (e) {
              return callback(e);
            }
    
            if (FS.isDir(stat.mode)) {
              check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
            }
    
            entries[path] = { timestamp: stat.mtime };
          }
    
          return callback(null, { type: 'local', entries: entries });
        },getRemoteSet:function (mount, callback) {
          var entries = {};
    
          IDBFS.getDB(mount.mountpoint, function(err, db) {
            if (err) return callback(err);
    
            try {
              var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
              transaction.onerror = function(e) {
                callback(this.error);
                e.preventDefault();
              };
    
              var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
              var index = store.index('timestamp');
    
              index.openKeyCursor().onsuccess = function(event) {
                var cursor = event.target.result;
    
                if (!cursor) {
                  return callback(null, { type: 'remote', db: db, entries: entries });
                }
    
                entries[cursor.primaryKey] = { timestamp: cursor.key };
    
                cursor.continue();
              };
            } catch (e) {
              return callback(e);
            }
          });
        },loadLocalEntry:function (path, callback) {
          var stat, node;
    
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
    
          if (FS.isDir(stat.mode)) {
            return callback(null, { timestamp: stat.mtime, mode: stat.mode });
          } else if (FS.isFile(stat.mode)) {
            // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
            // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
          } else {
            return callback(new Error('node type not supported'));
          }
        },storeLocalEntry:function (path, entry, callback) {
          try {
            if (FS.isDir(entry.mode)) {
              FS.mkdir(path, entry.mode);
            } else if (FS.isFile(entry.mode)) {
              FS.writeFile(path, entry.contents, { canOwn: true });
            } else {
              return callback(new Error('node type not supported'));
            }
    
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp);
          } catch (e) {
            return callback(e);
          }
    
          callback(null);
        },removeLocalEntry:function (path, callback) {
          try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
    
            if (FS.isDir(stat.mode)) {
              FS.rmdir(path);
            } else if (FS.isFile(stat.mode)) {
              FS.unlink(path);
            }
          } catch (e) {
            return callback(e);
          }
    
          callback(null);
        },loadRemoteEntry:function (store, path, callback) {
          var req = store.get(path);
          req.onsuccess = function(event) { callback(null, event.target.result); };
          req.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
        },storeRemoteEntry:function (store, path, entry, callback) {
          var req = store.put(entry, path);
          req.onsuccess = function() { callback(null); };
          req.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
        },removeRemoteEntry:function (store, path, callback) {
          var req = store.delete(path);
          req.onsuccess = function() { callback(null); };
          req.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
        },reconcile:function (src, dst, callback) {
          var total = 0;
    
          var create = [];
          Object.keys(src.entries).forEach(function (key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
              create.push(key);
              total++;
            }
          });
    
          var remove = [];
          Object.keys(dst.entries).forEach(function (key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
              remove.push(key);
              total++;
            }
          });
    
          if (!total) {
            return callback(null);
          }
    
          var errored = false;
          var completed = 0;
          var db = src.type === 'remote' ? src.db : dst.db;
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
    
          function done(err) {
            if (err) {
              if (!done.errored) {
                done.errored = true;
                return callback(err);
              }
              return;
            }
            if (++completed >= total) {
              return callback(null);
            }
          };
    
          transaction.onerror = function(e) {
            done(this.error);
            e.preventDefault();
          };
    
          // sort paths in ascending order so directory entries are created
          // before the files inside them
          create.sort().forEach(function (path) {
            if (dst.type === 'local') {
              IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                if (err) return done(err);
                IDBFS.storeLocalEntry(path, entry, done);
              });
            } else {
              IDBFS.loadLocalEntry(path, function (err, entry) {
                if (err) return done(err);
                IDBFS.storeRemoteEntry(store, path, entry, done);
              });
            }
          });
    
          // sort paths in descending order so files are deleted before their
          // parent directories
          remove.sort().reverse().forEach(function(path) {
            if (dst.type === 'local') {
              IDBFS.removeLocalEntry(path, done);
            } else {
              IDBFS.removeRemoteEntry(store, path, done);
            }
          });
        }};
    
    var NODEFS={isWindows:false,staticInit:function () {
          NODEFS.isWindows = !!process.platform.match(/^win/);
          var flags = process["binding"]("constants");
          // Node.js 4 compatibility: it has no namespaces for constants
          if (flags["fs"]) {
            flags = flags["fs"];
          }
          NODEFS.flagsForNodeMap = {
            "1024": flags["O_APPEND"],
            "64": flags["O_CREAT"],
            "128": flags["O_EXCL"],
            "0": flags["O_RDONLY"],
            "2": flags["O_RDWR"],
            "4096": flags["O_SYNC"],
            "512": flags["O_TRUNC"],
            "1": flags["O_WRONLY"]
          };
        },bufferFrom:function (arrayBuffer) {
          // Node.js < 4.5 compatibility: Buffer.from does not support ArrayBuffer
          // Buffer.from before 4.5 was just a method inherited from Uint8Array
          // Buffer.alloc has been added with Buffer.from together, so check it instead
          return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
        },mount:function (mount) {
          assert(ENVIRONMENT_IS_NODE);
          return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
        },createNode:function (parent, name, mode, dev) {
          if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var node = FS.createNode(parent, name, mode);
          node.node_ops = NODEFS.node_ops;
          node.stream_ops = NODEFS.stream_ops;
          return node;
        },getMode:function (path) {
          var stat;
          try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
              // Node.js on Windows never represents permission bit 'x', so
              // propagate read bits to execute bits
              stat.mode = stat.mode | ((stat.mode & 292) >> 2);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return stat.mode;
        },realPath:function (node) {
          var parts = [];
          while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent;
          }
          parts.push(node.mount.opts.root);
          parts.reverse();
          return PATH.join.apply(null, parts);
        },flagsForNode:function (flags) {
          flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
          flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
          flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
          flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
          var newFlags = 0;
          for (var k in NODEFS.flagsForNodeMap) {
            if (flags & k) {
              newFlags |= NODEFS.flagsForNodeMap[k];
              flags ^= k;
            }
          }
    
          if (!flags) {
            return newFlags;
          } else {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },node_ops:{getattr:function (node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
              stat = fs.lstatSync(path);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
            // See http://support.microsoft.com/kb/140365
            if (NODEFS.isWindows && !stat.blksize) {
              stat.blksize = 4096;
            }
            if (NODEFS.isWindows && !stat.blocks) {
              stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
            }
            return {
              dev: stat.dev,
              ino: stat.ino,
              mode: stat.mode,
              nlink: stat.nlink,
              uid: stat.uid,
              gid: stat.gid,
              rdev: stat.rdev,
              size: stat.size,
              atime: stat.atime,
              mtime: stat.mtime,
              ctime: stat.ctime,
              blksize: stat.blksize,
              blocks: stat.blocks
            };
          },setattr:function (node, attr) {
            var path = NODEFS.realPath(node);
            try {
              if (attr.mode !== undefined) {
                fs.chmodSync(path, attr.mode);
                // update the common node structure mode as well
                node.mode = attr.mode;
              }
              if (attr.timestamp !== undefined) {
                var date = new Date(attr.timestamp);
                fs.utimesSync(path, date, date);
              }
              if (attr.size !== undefined) {
                fs.truncateSync(path, attr.size);
              }
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },lookup:function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode);
          },mknod:function (parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            // create the backing node for this in the fs root as well
            var path = NODEFS.realPath(node);
            try {
              if (FS.isDir(node.mode)) {
                fs.mkdirSync(path, node.mode);
              } else {
                fs.writeFileSync(path, '', { mode: node.mode });
              }
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            return node;
          },rename:function (oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
              fs.renameSync(oldPath, newPath);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },unlink:function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
              fs.unlinkSync(path);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },rmdir:function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
              fs.rmdirSync(path);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },readdir:function (node) {
            var path = NODEFS.realPath(node);
            try {
              return fs.readdirSync(path);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },symlink:function (parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
              fs.symlinkSync(oldPath, newPath);
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },readlink:function (node) {
            var path = NODEFS.realPath(node);
            try {
              path = fs.readlinkSync(path);
              path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
              return path;
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          }},stream_ops:{open:function (stream) {
            var path = NODEFS.realPath(stream.node);
            try {
              if (FS.isFile(stream.node.mode)) {
                stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
              }
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },close:function (stream) {
            try {
              if (FS.isFile(stream.node.mode) && stream.nfd) {
                fs.closeSync(stream.nfd);
              }
            } catch (e) {
              if (!e.code) throw e;
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },read:function (stream, buffer, offset, length, position) {
            // Node.js < 6 compatibility: node errors on 0 length reads
            if (length === 0) return 0;
            try {
              return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },write:function (stream, buffer, offset, length, position) {
            try {
              return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          },llseek:function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {  // SEEK_CUR.
              position += stream.position;
            } else if (whence === 2) {  // SEEK_END.
              if (FS.isFile(stream.node.mode)) {
                try {
                  var stat = fs.fstatSync(stream.nfd);
                  position += stat.size;
                } catch (e) {
                  throw new FS.ErrnoError(ERRNO_CODES[e.code]);
                }
              }
            }
    
            if (position < 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
    
            return position;
          }}};
    
    var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
          assert(ENVIRONMENT_IS_WORKER);
          if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
          var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
          var createdParents = {};
          function ensureParent(path) {
            // return the parent node, creating subdirs as necessary
            var parts = path.split('/');
            var parent = root;
            for (var i = 0; i < parts.length-1; i++) {
              var curr = parts.slice(0, i+1).join('/');
              // Issue 4254: Using curr as a node name will prevent the node
              // from being found in FS.nameTable when FS.open is called on
              // a path which holds a child of this node,
              // given that all FS functions assume node names
              // are just their corresponding parts within their given path,
              // rather than incremental aggregates which include their parent's
              // directories.
              if (!createdParents[curr]) {
                createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
              }
              parent = createdParents[curr];
            }
            return parent;
          }
          function base(path) {
            var parts = path.split('/');
            return parts[parts.length-1];
          }
          // We also accept FileList here, by using Array.prototype
          Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
          });
          (mount.opts["blobs"] || []).forEach(function(obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
          });
          (mount.opts["packages"] || []).forEach(function(pack) {
            pack['metadata'].files.forEach(function(file) {
              var name = file.filename.substr(1); // remove initial slash
              WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
            });
          });
          return root;
        },createNode:function (parent, name, mode, dev, contents, mtime) {
          var node = FS.createNode(parent, name, mode);
          node.mode = mode;
          node.node_ops = WORKERFS.node_ops;
          node.stream_ops = WORKERFS.stream_ops;
          node.timestamp = (mtime || new Date).getTime();
          assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
          if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents;
          } else {
            node.size = 4096;
            node.contents = {};
          }
          if (parent) {
            parent.contents[name] = node;
          }
          return node;
        },node_ops:{getattr:function (node) {
            return {
              dev: 1,
              ino: undefined,
              mode: node.mode,
              nlink: 1,
              uid: 0,
              gid: 0,
              rdev: undefined,
              size: node.size,
              atime: new Date(node.timestamp),
              mtime: new Date(node.timestamp),
              ctime: new Date(node.timestamp),
              blksize: 4096,
              blocks: Math.ceil(node.size / 4096),
            };
          },setattr:function (node, attr) {
            if (attr.mode !== undefined) {
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              node.timestamp = attr.timestamp;
            }
          },lookup:function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
          },mknod:function (parent, name, mode, dev) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          },rename:function (oldNode, newDir, newName) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          },unlink:function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          },rmdir:function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          },readdir:function (node) {
            var entries = ['.', '..'];
            for (var key in node.contents) {
              if (!node.contents.hasOwnProperty(key)) {
                continue;
              }
              entries.push(key);
            }
            return entries;
          },symlink:function (parent, newName, oldPath) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          },readlink:function (node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
          }},stream_ops:{read:function (stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size;
          },write:function (stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          },llseek:function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {  // SEEK_CUR.
              position += stream.position;
            } else if (whence === 2) {  // SEEK_END.
              if (FS.isFile(stream.node.mode)) {
                position += stream.node.size;
              }
            }
            if (position < 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return position;
          }}};
    
    var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
    
    var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
    
    var _stdin=286928;
    
    var _stdout=286944;
    
    var _stderr=286960;var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function (e) {
          if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
          return ___setErrNo(e.errno);
        },lookupPath:function (path, opts) {
          path = PATH.resolve(FS.cwd(), path);
          opts = opts || {};
    
          if (!path) return { path: '', node: null };
    
          var defaults = {
            follow_mount: true,
            recurse_count: 0
          };
          for (var key in defaults) {
            if (opts[key] === undefined) {
              opts[key] = defaults[key];
            }
          }
    
          if (opts.recurse_count > 8) {  // max recursive lookup of 8
            throw new FS.ErrnoError(40);
          }
    
          // split the path
          var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
            return !!p;
          }), false);
    
          // start at the root
          var current = FS.root;
          var current_path = '/';
    
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
    
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
    
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current)) {
              if (!islast || (islast && opts.follow_mount)) {
                current = current.mounted.root;
              }
            }
    
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (!islast || opts.follow) {
              var count = 0;
              while (FS.isLink(current.mode)) {
                var link = FS.readlink(current_path);
                current_path = PATH.resolve(PATH.dirname(current_path), link);
    
                var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                current = lookup.node;
    
                if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                  throw new FS.ErrnoError(40);
                }
              }
            }
          }
    
          return { path: current_path, node: current };
        },getPath:function (node) {
          var path;
          while (true) {
            if (FS.isRoot(node)) {
              var mount = node.mount.mountpoint;
              if (!path) return mount;
              return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
            }
            path = path ? node.name + '/' + path : node.name;
            node = node.parent;
          }
        },hashName:function (parentid, name) {
          var hash = 0;
    
    
          for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
          }
          return ((parentid + hash) >>> 0) % FS.nameTable.length;
        },hashAddNode:function (node) {
          var hash = FS.hashName(node.parent.id, node.name);
          node.name_next = FS.nameTable[hash];
          FS.nameTable[hash] = node;
        },hashRemoveNode:function (node) {
          var hash = FS.hashName(node.parent.id, node.name);
          if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
          } else {
            var current = FS.nameTable[hash];
            while (current) {
              if (current.name_next === node) {
                current.name_next = node.name_next;
                break;
              }
              current = current.name_next;
            }
          }
        },lookupNode:function (parent, name) {
          var err = FS.mayLookup(parent);
          if (err) {
            throw new FS.ErrnoError(err, parent);
          }
          var hash = FS.hashName(parent.id, name);
          for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
              return node;
            }
          }
          // if we failed to find it in the cache, call into the VFS
          return FS.lookup(parent, name);
        },createNode:function (parent, name, mode, rdev) {
          if (!FS.FSNode) {
            FS.FSNode = function(parent, name, mode, rdev) {
              if (!parent) {
                parent = this;  // root node sets parent to itself
              }
              this.parent = parent;
              this.mount = parent.mount;
              this.mounted = null;
              this.id = FS.nextInode++;
              this.name = name;
              this.mode = mode;
              this.node_ops = {};
              this.stream_ops = {};
              this.rdev = rdev;
            };
    
            FS.FSNode.prototype = {};
    
            // compatibility
            var readMode = 292 | 73;
            var writeMode = 146;
    
            // NOTE we must use Object.defineProperties instead of individual calls to
            // Object.defineProperty in order to make closure compiler happy
            Object.defineProperties(FS.FSNode.prototype, {
              read: {
                get: function() { return (this.mode & readMode) === readMode; },
                set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
              },
              write: {
                get: function() { return (this.mode & writeMode) === writeMode; },
                set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
              },
              isFolder: {
                get: function() { return FS.isDir(this.mode); }
              },
              isDevice: {
                get: function() { return FS.isChrdev(this.mode); }
              }
            });
          }
    
          var node = new FS.FSNode(parent, name, mode, rdev);
    
          FS.hashAddNode(node);
    
          return node;
        },destroyNode:function (node) {
          FS.hashRemoveNode(node);
        },isRoot:function (node) {
          return node === node.parent;
        },isMountpoint:function (node) {
          return !!node.mounted;
        },isFile:function (mode) {
          return (mode & 61440) === 32768;
        },isDir:function (mode) {
          return (mode & 61440) === 16384;
        },isLink:function (mode) {
          return (mode & 61440) === 40960;
        },isChrdev:function (mode) {
          return (mode & 61440) === 8192;
        },isBlkdev:function (mode) {
          return (mode & 61440) === 24576;
        },isFIFO:function (mode) {
          return (mode & 61440) === 4096;
        },isSocket:function (mode) {
          return (mode & 49152) === 49152;
        },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
          var flags = FS.flagModes[str];
          if (typeof flags === 'undefined') {
            throw new Error('Unknown file open mode: ' + str);
          }
          return flags;
        },flagsToPermissionString:function (flag) {
          var perms = ['r', 'w', 'rw'][flag & 3];
          if ((flag & 512)) {
            perms += 'w';
          }
          return perms;
        },nodePermissions:function (node, perms) {
          if (FS.ignorePermissions) {
            return 0;
          }
          // return 0 if any user, group or owner bits are set.
          if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
            return 13;
          } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
            return 13;
          } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
            return 13;
          }
          return 0;
        },mayLookup:function (dir) {
          var err = FS.nodePermissions(dir, 'x');
          if (err) return err;
          if (!dir.node_ops.lookup) return 13;
          return 0;
        },mayCreate:function (dir, name) {
          try {
            var node = FS.lookupNode(dir, name);
            return 17;
          } catch (e) {
          }
          return FS.nodePermissions(dir, 'wx');
        },mayDelete:function (dir, name, isdir) {
          var node;
          try {
            node = FS.lookupNode(dir, name);
          } catch (e) {
            return e.errno;
          }
          var err = FS.nodePermissions(dir, 'wx');
          if (err) {
            return err;
          }
          if (isdir) {
            if (!FS.isDir(node.mode)) {
              return 20;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
              return 16;
            }
          } else {
            if (FS.isDir(node.mode)) {
              return 21;
            }
          }
          return 0;
        },mayOpen:function (node, flags) {
          if (!node) {
            return 2;
          }
          if (FS.isLink(node.mode)) {
            return 40;
          } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
                (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
              return 21;
            }
          }
          return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
        },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
          fd_start = fd_start || 0;
          fd_end = fd_end || FS.MAX_OPEN_FDS;
          for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
              return fd;
            }
          }
          throw new FS.ErrnoError(24);
        },getStream:function (fd) {
          return FS.streams[fd];
        },createStream:function (stream, fd_start, fd_end) {
          if (!FS.FSStream) {
            FS.FSStream = function(){};
            FS.FSStream.prototype = {};
            // compatibility
            Object.defineProperties(FS.FSStream.prototype, {
              object: {
                get: function() { return this.node; },
                set: function(val) { this.node = val; }
              },
              isRead: {
                get: function() { return (this.flags & 2097155) !== 1; }
              },
              isWrite: {
                get: function() { return (this.flags & 2097155) !== 0; }
              },
              isAppend: {
                get: function() { return (this.flags & 1024); }
              }
            });
          }
          // clone it, so we can return an instance of FSStream
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
          var fd = FS.nextfd(fd_start, fd_end);
          stream.fd = fd;
          FS.streams[fd] = stream;
          return stream;
        },closeStream:function (fd) {
          FS.streams[fd] = null;
        },chrdev_stream_ops:{open:function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            // override node's stream ops with the device's
            stream.stream_ops = device.stream_ops;
            // forward the open call
            if (stream.stream_ops.open) {
              stream.stream_ops.open(stream);
            }
          },llseek:function () {
            throw new FS.ErrnoError(29);
          }},major:function (dev) {
          return ((dev) >> 8);
        },minor:function (dev) {
          return ((dev) & 0xff);
        },makedev:function (ma, mi) {
          return ((ma) << 8 | (mi));
        },registerDevice:function (dev, ops) {
          FS.devices[dev] = { stream_ops: ops };
        },getDevice:function (dev) {
          return FS.devices[dev];
        },getMounts:function (mount) {
          var mounts = [];
          var check = [mount];
    
          while (check.length) {
            var m = check.pop();
    
            mounts.push(m);
    
            check.push.apply(check, m.mounts);
          }
    
          return mounts;
        },syncfs:function (populate, callback) {
          if (typeof(populate) === 'function') {
            callback = populate;
            populate = false;
          }
    
          FS.syncFSRequests++;
    
          if (FS.syncFSRequests > 1) {
            console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
          }
    
          var mounts = FS.getMounts(FS.root.mount);
          var completed = 0;
    
          function doCallback(err) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err);
          }
    
          function done(err) {
            if (err) {
              if (!done.errored) {
                done.errored = true;
                return doCallback(err);
              }
              return;
            }
            if (++completed >= mounts.length) {
              doCallback(null);
            }
          };
    
          // sync all mounts
          mounts.forEach(function (mount) {
            if (!mount.type.syncfs) {
              return done(null);
            }
            mount.type.syncfs(mount, populate, done);
          });
        },mount:function (type, opts, mountpoint) {
          var root = mountpoint === '/';
          var pseudo = !mountpoint;
          var node;
    
          if (root && FS.root) {
            throw new FS.ErrnoError(16);
          } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    
            mountpoint = lookup.path;  // use the absolute path
            node = lookup.node;
    
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(16);
            }
    
            if (!FS.isDir(node.mode)) {
              throw new FS.ErrnoError(20);
            }
          }
    
          var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
          };
    
          // create a root node for the fs
          var mountRoot = type.mount(mount);
          mountRoot.mount = mount;
          mount.root = mountRoot;
    
          if (root) {
            FS.root = mountRoot;
          } else if (node) {
            // set as a mountpoint
            node.mounted = mount;
    
            // add the new mount to the current mount's children
            if (node.mount) {
              node.mount.mounts.push(mount);
            }
          }
    
          return mountRoot;
        },unmount:function (mountpoint) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    
          if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(22);
          }
    
          // destroy the nodes for this mount, and all its child mounts
          var node = lookup.node;
          var mount = node.mounted;
          var mounts = FS.getMounts(mount);
    
          Object.keys(FS.nameTable).forEach(function (hash) {
            var current = FS.nameTable[hash];
    
            while (current) {
              var next = current.name_next;
    
              if (mounts.indexOf(current.mount) !== -1) {
                FS.destroyNode(current);
              }
    
              current = next;
            }
          });
    
          // no longer a mountpoint
          node.mounted = null;
    
          // remove this mount from the child mounts
          var idx = node.mount.mounts.indexOf(mount);
          assert(idx !== -1);
          node.mount.mounts.splice(idx, 1);
        },lookup:function (parent, name) {
          return parent.node_ops.lookup(parent, name);
        },mknod:function (path, mode, dev) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          var name = PATH.basename(path);
          if (!name || name === '.' || name === '..') {
            throw new FS.ErrnoError(22);
          }
          var err = FS.mayCreate(parent, name);
          if (err) {
            throw new FS.ErrnoError(err);
          }
          if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(1);
          }
          return parent.node_ops.mknod(parent, name, mode, dev);
        },create:function (path, mode) {
          mode = mode !== undefined ? mode : 438 /* 0666 */;
          mode &= 4095;
          mode |= 32768;
          return FS.mknod(path, mode, 0);
        },mkdir:function (path, mode) {
          mode = mode !== undefined ? mode : 511 /* 0777 */;
          mode &= 511 | 512;
          mode |= 16384;
          return FS.mknod(path, mode, 0);
        },mkdirTree:function (path, mode) {
          var dirs = path.split('/');
          var d = '';
          for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += '/' + dirs[i];
            try {
              FS.mkdir(d, mode);
            } catch(e) {
              if (e.errno != 17) throw e;
            }
          }
        },mkdev:function (path, mode, dev) {
          if (typeof(dev) === 'undefined') {
            dev = mode;
            mode = 438 /* 0666 */;
          }
          mode |= 8192;
          return FS.mknod(path, mode, dev);
        },symlink:function (oldpath, newpath) {
          if (!PATH.resolve(oldpath)) {
            throw new FS.ErrnoError(2);
          }
          var lookup = FS.lookupPath(newpath, { parent: true });
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(2);
          }
          var newname = PATH.basename(newpath);
          var err = FS.mayCreate(parent, newname);
          if (err) {
            throw new FS.ErrnoError(err);
          }
          if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(1);
          }
          return parent.node_ops.symlink(parent, newname, oldpath);
        },rename:function (old_path, new_path) {
          var old_dirname = PATH.dirname(old_path);
          var new_dirname = PATH.dirname(new_path);
          var old_name = PATH.basename(old_path);
          var new_name = PATH.basename(new_path);
          // parents must exist
          var lookup, old_dir, new_dir;
          try {
            lookup = FS.lookupPath(old_path, { parent: true });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, { parent: true });
            new_dir = lookup.node;
          } catch (e) {
            throw new FS.ErrnoError(16);
          }
          if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
          // need to be part of the same mount
          if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(18);
          }
          // source must exist
          var old_node = FS.lookupNode(old_dir, old_name);
          // old path should not be an ancestor of the new path
          var relative = PATH.relative(old_path, new_dirname);
          if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(22);
          }
          // new path should not be an ancestor of the old path
          relative = PATH.relative(new_path, old_dirname);
          if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(39);
          }
          // see if the new path already exists
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {
            // not fatal
          }
          // early out if nothing needs to change
          if (old_node === new_node) {
            return;
          }
          // we'll need to delete the old entry
          var isdir = FS.isDir(old_node.mode);
          var err = FS.mayDelete(old_dir, old_name, isdir);
          if (err) {
            throw new FS.ErrnoError(err);
          }
          // need delete permissions if we'll be overwriting.
          // need create permissions if new doesn't already exist.
          err = new_node ?
            FS.mayDelete(new_dir, new_name, isdir) :
            FS.mayCreate(new_dir, new_name);
          if (err) {
            throw new FS.ErrnoError(err);
          }
          if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(1);
          }
          if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(16);
          }
          // if we are going to change the parent, check write permissions
          if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, 'w');
            if (err) {
              throw new FS.ErrnoError(err);
            }
          }
          try {
            if (FS.trackingDelegate['willMovePath']) {
              FS.trackingDelegate['willMovePath'](old_path, new_path);
            }
          } catch(e) {
            console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
          }
          // remove the node from the lookup hash
          FS.hashRemoveNode(old_node);
          // do the underlying fs rename
          try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
          } catch (e) {
            throw e;
          } finally {
            // add the node back to the hash (in case node_ops.rename
            // changed its name)
            FS.hashAddNode(old_node);
          }
          try {
            if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
          } catch(e) {
            console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
          }
        },rmdir:function (path) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var err = FS.mayDelete(parent, name, true);
          if (err) {
            throw new FS.ErrnoError(err);
          }
          if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(1);
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(16);
          }
          try {
            if (FS.trackingDelegate['willDeletePath']) {
              FS.trackingDelegate['willDeletePath'](path);
            }
          } catch(e) {
            console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
          }
          parent.node_ops.rmdir(parent, name);
          FS.destroyNode(node);
          try {
            if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
          } catch(e) {
            console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
          }
        },readdir:function (path) {
          var lookup = FS.lookupPath(path, { follow: true });
          var node = lookup.node;
          if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(20);
          }
          return node.node_ops.readdir(node);
        },unlink:function (path) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var err = FS.mayDelete(parent, name, false);
          if (err) {
            // According to POSIX, we should map EISDIR to EPERM, but
            // we instead do what Linux does (and we must, as we use
            // the musl linux libc).
            throw new FS.ErrnoError(err);
          }
          if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(1);
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(16);
          }
          try {
            if (FS.trackingDelegate['willDeletePath']) {
              FS.trackingDelegate['willDeletePath'](path);
            }
          } catch(e) {
            console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
          }
          parent.node_ops.unlink(parent, name);
          FS.destroyNode(node);
          try {
            if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
          } catch(e) {
            console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
          }
        },readlink:function (path) {
          var lookup = FS.lookupPath(path);
          var link = lookup.node;
          if (!link) {
            throw new FS.ErrnoError(2);
          }
          if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(22);
          }
          return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
        },stat:function (path, dontFollow) {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          var node = lookup.node;
          if (!node) {
            throw new FS.ErrnoError(2);
          }
          if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(1);
          }
          return node.node_ops.getattr(node);
        },lstat:function (path) {
          return FS.stat(path, true);
        },chmod:function (path, mode, dontFollow) {
          var node;
          if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
          } else {
            node = path;
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1);
          }
          node.node_ops.setattr(node, {
            mode: (mode & 4095) | (node.mode & ~4095),
            timestamp: Date.now()
          });
        },lchmod:function (path, mode) {
          FS.chmod(path, mode, true);
        },fchmod:function (fd, mode) {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(9);
          }
          FS.chmod(stream.node, mode);
        },chown:function (path, uid, gid, dontFollow) {
          var node;
          if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
          } else {
            node = path;
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1);
          }
          node.node_ops.setattr(node, {
            timestamp: Date.now()
            // we ignore the uid / gid for now
          });
        },lchown:function (path, uid, gid) {
          FS.chown(path, uid, gid, true);
        },fchown:function (fd, uid, gid) {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(9);
          }
          FS.chown(stream.node, uid, gid);
        },truncate:function (path, len) {
          if (len < 0) {
            throw new FS.ErrnoError(22);
          }
          var node;
          if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
          } else {
            node = path;
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1);
          }
          if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(21);
          }
          if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(22);
          }
          var err = FS.nodePermissions(node, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
          node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
          });
        },ftruncate:function (fd, len) {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(9);
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(22);
          }
          FS.truncate(stream.node, len);
        },utime:function (path, atime, mtime) {
          var lookup = FS.lookupPath(path, { follow: true });
          var node = lookup.node;
          node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
          });
        },open:function (path, flags, mode, fd_start, fd_end) {
          if (path === "") {
            throw new FS.ErrnoError(2);
          }
          flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
          mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
          if ((flags & 64)) {
            mode = (mode & 4095) | 32768;
          } else {
            mode = 0;
          }
          var node;
          if (typeof path === 'object') {
            node = path;
          } else {
            path = PATH.normalize(path);
            try {
              var lookup = FS.lookupPath(path, {
                follow: !(flags & 131072)
              });
              node = lookup.node;
            } catch (e) {
              // ignore
            }
          }
          // perhaps we need to create the node
          var created = false;
          if ((flags & 64)) {
            if (node) {
              // if O_CREAT and O_EXCL are set, error out if the node already exists
              if ((flags & 128)) {
                throw new FS.ErrnoError(17);
              }
            } else {
              // node doesn't exist, try to create it
              node = FS.mknod(path, mode, 0);
              created = true;
            }
          }
          if (!node) {
            throw new FS.ErrnoError(2);
          }
          // can't truncate a device
          if (FS.isChrdev(node.mode)) {
            flags &= ~512;
          }
          // if asked only for a directory, then this must be one
          if ((flags & 65536) && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(20);
          }
          // check permissions, if this is not a file we just created now (it is ok to
          // create and write to a file with read-only permissions; it is read-only
          // for later use)
          if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
              throw new FS.ErrnoError(err);
            }
          }
          // do truncation if necessary
          if ((flags & 512)) {
            FS.truncate(node, 0);
          }
          // we've already handled these, don't pass down to the underlying vfs
          flags &= ~(128 | 512);
    
          // register the stream with the filesystem
          var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),  // we want the absolute path to the node
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            // used by the file family libc calls (fopen, fwrite, ferror, etc.)
            ungotten: [],
            error: false
          }, fd_start, fd_end);
          // call the new stream's open function
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
          if (Module['logReadFiles'] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
              FS.readFiles[path] = 1;
              console.log("FS.trackingDelegate error on read file: " + path);
            }
          }
          try {
            if (FS.trackingDelegate['onOpenFile']) {
              var trackingFlags = 0;
              if ((flags & 2097155) !== 1) {
                trackingFlags |= FS.tracking.openFlags.READ;
              }
              if ((flags & 2097155) !== 0) {
                trackingFlags |= FS.tracking.openFlags.WRITE;
              }
              FS.trackingDelegate['onOpenFile'](path, trackingFlags);
            }
          } catch(e) {
            console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
          }
          return stream;
        },close:function (stream) {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9);
          }
          if (stream.getdents) stream.getdents = null; // free readdir state
          try {
            if (stream.stream_ops.close) {
              stream.stream_ops.close(stream);
            }
          } catch (e) {
            throw e;
          } finally {
            FS.closeStream(stream.fd);
          }
          stream.fd = null;
        },isClosed:function (stream) {
          return stream.fd === null;
        },llseek:function (stream, offset, whence) {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9);
          }
          if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(29);
          }
          if (whence != 0 /* SEEK_SET */ && whence != 1 /* SEEK_CUR */ && whence != 2 /* SEEK_END */) {
            throw new FS.ErrnoError(22);
          }
          stream.position = stream.stream_ops.llseek(stream, offset, whence);
          stream.ungotten = [];
          return stream.position;
        },read:function (stream, buffer, offset, length, position) {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(22);
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9);
          }
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(9);
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(21);
          }
          if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(22);
          }
          var seeking = typeof position !== 'undefined';
          if (!seeking) {
            position = stream.position;
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(29);
          }
          var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
          if (!seeking) stream.position += bytesRead;
          return bytesRead;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(22);
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9);
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(9);
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(21);
          }
          if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(22);
          }
          if (stream.flags & 1024) {
            // seek to the end before writing in append mode
            FS.llseek(stream, 0, 2);
          }
          var seeking = typeof position !== 'undefined';
          if (!seeking) {
            position = stream.position;
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(29);
          }
          var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
          if (!seeking) stream.position += bytesWritten;
          try {
            if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
          } catch(e) {
            console.log("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
          }
          return bytesWritten;
        },allocate:function (stream, offset, length) {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9);
          }
          if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(22);
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(9);
          }
          if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(19);
          }
          if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(95);
          }
          stream.stream_ops.allocate(stream, offset, length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          // TODO if PROT is PROT_WRITE, make sure we have write access
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(13);
          }
          if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(19);
          }
          return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!stream || !stream.stream_ops.msync) {
            return 0;
          }
          return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
        },munmap:function (stream) {
          return 0;
        },ioctl:function (stream, cmd, arg) {
          if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(25);
          }
          return stream.stream_ops.ioctl(stream, cmd, arg);
        },readFile:function (path, opts) {
          opts = opts || {};
          opts.flags = opts.flags || 'r';
          opts.encoding = opts.encoding || 'binary';
          if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
            throw new Error('Invalid encoding type "' + opts.encoding + '"');
          }
          var ret;
          var stream = FS.open(path, opts.flags);
          var stat = FS.stat(path);
          var length = stat.size;
          var buf = new Uint8Array(length);
          FS.read(stream, buf, 0, length, 0);
          if (opts.encoding === 'utf8') {
            ret = UTF8ArrayToString(buf, 0);
          } else if (opts.encoding === 'binary') {
            ret = buf;
          }
          FS.close(stream);
          return ret;
        },writeFile:function (path, data, opts) {
          opts = opts || {};
          opts.flags = opts.flags || 'w';
          var stream = FS.open(path, opts.flags, opts.mode);
          if (typeof data === 'string') {
            var buf = new Uint8Array(lengthBytesUTF8(data)+1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
          } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
          } else {
            throw new Error('Unsupported data type');
          }
          FS.close(stream);
        },cwd:function () {
          return FS.currentPath;
        },chdir:function (path) {
          var lookup = FS.lookupPath(path, { follow: true });
          if (lookup.node === null) {
            throw new FS.ErrnoError(2);
          }
          if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(20);
          }
          var err = FS.nodePermissions(lookup.node, 'x');
          if (err) {
            throw new FS.ErrnoError(err);
          }
          FS.currentPath = lookup.path;
        },createDefaultDirectories:function () {
          FS.mkdir('/tmp');
          FS.mkdir('/home');
          FS.mkdir('/home/web_user');
        },createDefaultDevices:function () {
          // create /dev
          FS.mkdir('/dev');
          // setup /dev/null
          FS.registerDevice(FS.makedev(1, 3), {
            read: function() { return 0; },
            write: function(stream, buffer, offset, length, pos) { return length; }
          });
          FS.mkdev('/dev/null', FS.makedev(1, 3));
          // setup /dev/tty and /dev/tty1
          // stderr needs to print output using Module['printErr']
          // so we register a second tty just for it.
          TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
          TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
          FS.mkdev('/dev/tty', FS.makedev(5, 0));
          FS.mkdev('/dev/tty1', FS.makedev(6, 0));
          // setup /dev/[u]random
          var random_device;
          if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
            // for modern web browsers
            var randomBuffer = new Uint8Array(1);
            random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
          } else
          if (ENVIRONMENT_IS_NODE) {
            // for nodejs with or without crypto support included
            try {
              var crypto_module = require('crypto');
              // nodejs has crypto support
              random_device = function() { return crypto_module['randomBytes'](1)[0]; };
            } catch (e) {
              // nodejs doesn't have crypto support
            }
          } else
          {}
          if (!random_device) {
            // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
            random_device = function() { abort("no cryptographic support found for random_device. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
          }
          FS.createDevice('/dev', 'random', random_device);
          FS.createDevice('/dev', 'urandom', random_device);
          // we're not going to emulate the actual shm device,
          // just create the tmp dirs that reside in it commonly
          FS.mkdir('/dev/shm');
          FS.mkdir('/dev/shm/tmp');
        },createSpecialDirectories:function () {
          // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
          FS.mkdir('/proc');
          FS.mkdir('/proc/self');
          FS.mkdir('/proc/self/fd');
          FS.mount({
            mount: function() {
              var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
              node.node_ops = {
                lookup: function(parent, name) {
                  var fd = +name;
                  var stream = FS.getStream(fd);
                  if (!stream) throw new FS.ErrnoError(9);
                  var ret = {
                    parent: null,
                    mount: { mountpoint: 'fake' },
                    node_ops: { readlink: function() { return stream.path } }
                  };
                  ret.parent = ret; // make it look like a simple root node
                  return ret;
                }
              };
              return node;
            }
          }, {}, '/proc/self/fd');
        },createStandardStreams:function () {
          // TODO deprecate the old functionality of a single
          // input / output callback and that utilizes FS.createDevice
          // and instead require a unique set of stream ops
    
          // by default, we symlink the standard streams to the
          // default tty devices. however, if the standard streams
          // have been overwritten we create a unique device for
          // them instead.
          if (Module['stdin']) {
            FS.createDevice('/dev', 'stdin', Module['stdin']);
          } else {
            FS.symlink('/dev/tty', '/dev/stdin');
          }
          if (Module['stdout']) {
            FS.createDevice('/dev', 'stdout', null, Module['stdout']);
          } else {
            FS.symlink('/dev/tty', '/dev/stdout');
          }
          if (Module['stderr']) {
            FS.createDevice('/dev', 'stderr', null, Module['stderr']);
          } else {
            FS.symlink('/dev/tty1', '/dev/stderr');
          }
    
          // open default streams for the stdin, stdout and stderr devices
          var stdin = FS.open('/dev/stdin', 'r');
          var stdout = FS.open('/dev/stdout', 'w');
          var stderr = FS.open('/dev/stderr', 'w');
          assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
          assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
          assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
        },ensureErrnoError:function () {
          if (FS.ErrnoError) return;
          FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
              this.errno = errno;
              for (var key in ERRNO_CODES) {
                if (ERRNO_CODES[key] === errno) {
                  this.code = key;
                  break;
                }
              }
            };
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno];
            // Node.js compatibility: assigning on this.stack fails on Node 4 (but fixed on Node 8)
            if (this.stack) Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
            if (this.stack) this.stack = demangleAll(this.stack);
          };
          FS.ErrnoError.prototype = new Error();
          FS.ErrnoError.prototype.constructor = FS.ErrnoError;
          // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
          [2].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = '<generic error, no stack>';
          });
        },staticInit:function () {
          FS.ensureErrnoError();
    
          FS.nameTable = new Array(4096);
    
          FS.mount(MEMFS, {}, '/');
    
          FS.createDefaultDirectories();
          FS.createDefaultDevices();
          FS.createSpecialDirectories();
    
          FS.filesystems = {
            'MEMFS': MEMFS,
            'IDBFS': IDBFS,
            'NODEFS': NODEFS,
            'WORKERFS': WORKERFS,
          };
        },init:function (input, output, error) {
          assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
          FS.init.initialized = true;
    
          FS.ensureErrnoError();
    
          // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
          Module['stdin'] = input || Module['stdin'];
          Module['stdout'] = output || Module['stdout'];
          Module['stderr'] = error || Module['stderr'];
    
          FS.createStandardStreams();
        },quit:function () {
          FS.init.initialized = false;
          // force-flush all streams, so we get musl std streams printed out
          var fflush = Module['_fflush'];
          if (fflush) fflush(0);
          // close all of our streams
          for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
              continue;
            }
            FS.close(stream);
          }
        },getMode:function (canRead, canWrite) {
          var mode = 0;
          if (canRead) mode |= 292 | 73;
          if (canWrite) mode |= 146;
          return mode;
        },joinPath:function (parts, forceRelative) {
          var path = PATH.join.apply(null, parts);
          if (forceRelative && path[0] == '/') path = path.substr(1);
          return path;
        },absolutePath:function (relative, base) {
          return PATH.resolve(base, relative);
        },standardizePath:function (path) {
          return PATH.normalize(path);
        },findObject:function (path, dontResolveLastLink) {
          var ret = FS.analyzePath(path, dontResolveLastLink);
          if (ret.exists) {
            return ret.object;
          } else {
            ___setErrNo(ret.error);
            return null;
          }
        },analyzePath:function (path, dontResolveLastLink) {
          // operate from within the context of the symlink's target
          try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
          } catch (e) {
          }
          var ret = {
            isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
            parentExists: false, parentPath: null, parentObject: null
          };
          try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === '/';
          } catch (e) {
            ret.error = e.errno;
          };
          return ret;
        },createFolder:function (parent, name, canRead, canWrite) {
          var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
          var mode = FS.getMode(canRead, canWrite);
          return FS.mkdir(path, mode);
        },createPath:function (parent, path, canRead, canWrite) {
          parent = typeof parent === 'string' ? parent : FS.getPath(parent);
          var parts = path.split('/').reverse();
          while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
              FS.mkdir(current);
            } catch (e) {
              // ignore EEXIST
            }
            parent = current;
          }
          return current;
        },createFile:function (parent, name, properties, canRead, canWrite) {
          var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
          var mode = FS.getMode(canRead, canWrite);
          return FS.create(path, mode);
        },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
          var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
          var mode = FS.getMode(canRead, canWrite);
          var node = FS.create(path, mode);
          if (data) {
            if (typeof data === 'string') {
              var arr = new Array(data.length);
              for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
              data = arr;
            }
            // make sure we can write to the file
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 'w');
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
          }
          return node;
        },createDevice:function (parent, name, input, output) {
          var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
          var mode = FS.getMode(!!input, !!output);
          if (!FS.createDevice.major) FS.createDevice.major = 64;
          var dev = FS.makedev(FS.createDevice.major++, 0);
          // Create a fake device that a set of stream ops to emulate
          // the old behavior.
          FS.registerDevice(dev, {
            open: function(stream) {
              stream.seekable = false;
            },
            close: function(stream) {
              // flush any pending line data
              if (output && output.buffer && output.buffer.length) {
                output(10);
              }
            },
            read: function(stream, buffer, offset, length, pos /* ignored */) {
              var bytesRead = 0;
              for (var i = 0; i < length; i++) {
                var result;
                try {
                  result = input();
                } catch (e) {
                  throw new FS.ErrnoError(5);
                }
                if (result === undefined && bytesRead === 0) {
                  throw new FS.ErrnoError(11);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset+i] = result;
              }
              if (bytesRead) {
                stream.node.timestamp = Date.now();
              }
              return bytesRead;
            },
            write: function(stream, buffer, offset, length, pos) {
              for (var i = 0; i < length; i++) {
                try {
                  output(buffer[offset+i]);
                } catch (e) {
                  throw new FS.ErrnoError(5);
                }
              }
              if (length) {
                stream.node.timestamp = Date.now();
              }
              return i;
            }
          });
          return FS.mkdev(path, mode, dev);
        },createLink:function (parent, name, target, canRead, canWrite) {
          var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
          return FS.symlink(target, path);
        },forceLoadFile:function (obj) {
          if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
          var success = true;
          if (typeof XMLHttpRequest !== 'undefined') {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
          } else if (Module['read']) {
            // Command-line.
            try {
              // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
              //          read() will try to parse UTF8.
              obj.contents = intArrayFromString(Module['read'](obj.url), true);
              obj.usedBytes = obj.contents.length;
            } catch (e) {
              success = false;
            }
          } else {
            throw new Error('Cannot load without read() or XMLHttpRequest.');
          }
          if (!success) ___setErrNo(5);
          return success;
        },createLazyFile:function (parent, name, url, canRead, canWrite) {
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
    
            var chunkSize = 1024*1024; // Chunk size in bytes
    
            if (!hasByteServing) chunkSize = datalength;
    
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
    
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
    
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
    
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
    
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          if (typeof XMLHttpRequest !== 'undefined') {
            if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
            var lazyArray = new LazyUint8Array();
            Object.defineProperties(lazyArray, {
              length: {
                get: function() {
                  if(!this.lengthKnown) {
                    this.cacheLength();
                  }
                  return this._length;
                }
              },
              chunkSize: {
                get: function() {
                  if(!this.lengthKnown) {
                    this.cacheLength();
                  }
                  return this._chunkSize;
                }
              }
            });
    
            var properties = { isDevice: false, contents: lazyArray };
          } else {
            var properties = { isDevice: false, url: url };
          }
    
          var node = FS.createFile(parent, name, properties, canRead, canWrite);
          // This is a total hack, but I want to get this lazy file code out of the
          // core of MEMFS. If we want to keep this lazy file concept I feel it should
          // be its own thin LAZYFS proxying calls to MEMFS.
          if (properties.contents) {
            node.contents = properties.contents;
          } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
          }
          // Add a function that defers querying the file size until it is asked the first time.
          Object.defineProperties(node, {
            usedBytes: {
              get: function() { return this.contents.length; }
            }
          });
          // override each stream op with one that tries to force load the lazy file first
          var stream_ops = {};
          var keys = Object.keys(node.stream_ops);
          keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
              if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(5);
              }
              return fn.apply(null, arguments);
            };
          });
          // use a custom read function
          stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(5);
            }
            var contents = stream.node.contents;
            if (position >= contents.length)
              return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) { // normal array
              for (var i = 0; i < size; i++) {
                buffer[offset + i] = contents[position + i];
              }
            } else {
              for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
                buffer[offset + i] = contents.get(position + i);
              }
            }
            return size;
          };
          node.stream_ops = stream_ops;
          return node;
        },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
          Browser.init(); // XXX perhaps this method should move onto Browser?
          // TODO we should allow people to just pass in a complete filename instead
          // of parent and name being that we just join them anyways
          var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
          var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
          function processData(byteArray) {
            function finish(byteArray) {
              if (preFinish) preFinish();
              if (!dontCreateFile) {
                FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
              }
              if (onload) onload();
              removeRunDependency(dep);
            }
            var handled = false;
            Module['preloadPlugins'].forEach(function(plugin) {
              if (handled) return;
              if (plugin['canHandle'](fullname)) {
                plugin['handle'](byteArray, fullname, finish, function() {
                  if (onerror) onerror();
                  removeRunDependency(dep);
                });
                handled = true;
              }
            });
            if (!handled) finish(byteArray);
          }
          addRunDependency(dep);
          if (typeof url == 'string') {
            Browser.asyncLoad(url, function(byteArray) {
              processData(byteArray);
            }, onerror);
          } else {
            processData(url);
          }
        },indexedDB:function () {
          return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        },DB_NAME:function () {
          return 'EM_FS_' + window.location.pathname;
        },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
          onload = onload || function(){};
          onerror = onerror || function(){};
          var indexedDB = FS.indexedDB();
          try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
          } catch (e) {
            return onerror(e);
          }
          openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log('creating db');
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME);
          };
          openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;
            function finish() {
              if (fail == 0) onload(); else onerror();
            }
            paths.forEach(function(path) {
              var putRequest = files.put(FS.analyzePath(path).object.contents, path);
              putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
              putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
            });
            transaction.onerror = onerror;
          };
          openRequest.onerror = onerror;
        },loadFilesFromDB:function (paths, onload, onerror) {
          onload = onload || function(){};
          onerror = onerror || function(){};
          var indexedDB = FS.indexedDB();
          try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
          } catch (e) {
            return onerror(e);
          }
          openRequest.onupgradeneeded = onerror; // no database to load from
          openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
              var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
            } catch(e) {
              onerror(e);
              return;
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;
            function finish() {
              if (fail == 0) onload(); else onerror();
            }
            paths.forEach(function(path) {
              var getRequest = files.get(path);
              getRequest.onsuccess = function getRequest_onsuccess() {
                if (FS.analyzePath(path).exists) {
                  FS.unlink(path);
                }
                FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                ok++;
                if (ok + fail == total) finish();
              };
              getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
            });
            transaction.onerror = onerror;
          };
          openRequest.onerror = onerror;
        }};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
          if (path[0] !== '/') {
            // relative path
            var dir;
            if (dirfd === -100) {
              dir = FS.cwd();
            } else {
              var dirstream = FS.getStream(dirfd);
              if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
              dir = dirstream.path;
            }
            path = PATH.join2(dir, path);
          }
          return path;
        },doStat:function (func, path, buf) {
          try {
            var stat = func(path);
          } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
              // an error occurred while trying to look up the path; we should just report ENOTDIR
              return -ERRNO_CODES.ENOTDIR;
            }
            throw e;
          }
          HEAP32[((buf)>>2)]=stat.dev;
          HEAP32[(((buf)+(4))>>2)]=0;
          HEAP32[(((buf)+(8))>>2)]=stat.ino;
          HEAP32[(((buf)+(12))>>2)]=stat.mode;
          HEAP32[(((buf)+(16))>>2)]=stat.nlink;
          HEAP32[(((buf)+(20))>>2)]=stat.uid;
          HEAP32[(((buf)+(24))>>2)]=stat.gid;
          HEAP32[(((buf)+(28))>>2)]=stat.rdev;
          HEAP32[(((buf)+(32))>>2)]=0;
          HEAP32[(((buf)+(36))>>2)]=stat.size;
          HEAP32[(((buf)+(40))>>2)]=4096;
          HEAP32[(((buf)+(44))>>2)]=stat.blocks;
          HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
          HEAP32[(((buf)+(52))>>2)]=0;
          HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
          HEAP32[(((buf)+(60))>>2)]=0;
          HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
          HEAP32[(((buf)+(68))>>2)]=0;
          HEAP32[(((buf)+(72))>>2)]=stat.ino;
          return 0;
        },doMsync:function (addr, stream, len, flags) {
          var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
          FS.msync(stream, buffer, 0, len, flags);
        },doMkdir:function (path, mode) {
          // remove a trailing slash, if one - /a/b/ has basename of '', but
          // we want to create b in the context of this function
          path = PATH.normalize(path);
          if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
          FS.mkdir(path, mode, 0);
          return 0;
        },doMknod:function (path, mode, dev) {
          // we don't want this in the JS API as it uses mknod to create all nodes.
          switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
              break;
            default: return -ERRNO_CODES.EINVAL;
          }
          FS.mknod(path, mode, dev);
          return 0;
        },doReadlink:function (path, buf, bufsize) {
          if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
          var ret = FS.readlink(path);
    
          var len = Math.min(bufsize, lengthBytesUTF8(ret));
          var endChar = HEAP8[buf+len];
          stringToUTF8(ret, buf, bufsize+1);
          // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
          // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
          HEAP8[buf+len] = endChar;
    
          return len;
        },doAccess:function (path, amode) {
          if (amode & ~7) {
            // need a valid mode
            return -ERRNO_CODES.EINVAL;
          }
          var node;
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
          var perms = '';
          if (amode & 4) perms += 'r';
          if (amode & 2) perms += 'w';
          if (amode & 1) perms += 'x';
          if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
            return -ERRNO_CODES.EACCES;
          }
          return 0;
        },doDup:function (path, flags, suggestFD) {
          var suggest = FS.getStream(suggestFD);
          if (suggest) FS.close(suggest);
          return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
        },doReadv:function (stream, iov, iovcnt, offset) {
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(((iov)+(i*8))>>2)];
            var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
            var curr = FS.read(stream, HEAP8,ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break; // nothing more to read
          }
          return ret;
        },doWritev:function (stream, iov, iovcnt, offset) {
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(((iov)+(i*8))>>2)];
            var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
            var curr = FS.write(stream, HEAP8,ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
          }
          return ret;
        },varargs:0,get:function (varargs) {
          SYSCALLS.varargs += 4;
          var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
          return ret;
        },getStr:function () {
          var ret = UTF8ToString(SYSCALLS.get());
          return ret;
        },getStreamFromFD:function () {
          var stream = FS.getStream(SYSCALLS.get());
          if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
          return stream;
        },getSocketFromFD:function () {
          var socket = SOCKFS.getSocket(SYSCALLS.get());
          if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
          return socket;
        },getSocketAddress:function (allowNull) {
          var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
          if (allowNull && addrp === 0) return null;
          var info = __read_sockaddr(addrp, addrlen);
          if (info.errno) throw new FS.ErrnoError(info.errno);
          info.addr = DNS.lookup_addr(info.addr) || info.addr;
          return info;
        },get64:function () {
          var low = SYSCALLS.get(), high = SYSCALLS.get();
          if (low >= 0) assert(high === 0);
          else assert(high === -1);
          return low;
        },getZero:function () {
          assert(SYSCALLS.get() === 0);
        }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // llseek
        var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
        // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
        var offset = offset_low;
        FS.llseek(stream, offset, whence);
        HEAP32[((result)>>2)]=stream.position;
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
        return 0;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // readv
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // writev
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall195(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // SYS_stat64
        var path = SYSCALLS.getStr(), buf = SYSCALLS.get();
        return SYSCALLS.doStat(FS.stat, path, buf);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall197(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // SYS_fstat64
        var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get();
        return SYSCALLS.doStat(FS.stat, stream.path, buf);
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // fcntl64
        var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
        switch (cmd) {
          case 0: {
            var arg = SYSCALLS.get();
            if (arg < 0) {
              return -ERRNO_CODES.EINVAL;
            }
            var newStream;
            newStream = FS.open(stream.path, stream.flags, 0, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;  // FD_CLOEXEC makes no sense for a single process.
          case 3:
            return stream.flags;
          case 4: {
            var arg = SYSCALLS.get();
            stream.flags |= arg;
            return 0;
          }
          case 12:
          /* case 12: Currently in musl F_GETLK64 has same value as F_GETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */ {
            
            var arg = SYSCALLS.get();
            var offset = 0;
            // We're always unlocked.
            HEAP16[(((arg)+(offset))>>1)]=2;
            return 0;
          }
          case 13:
          case 14:
          /* case 13: Currently in musl F_SETLK64 has same value as F_SETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
          /* case 14: Currently in musl F_SETLKW64 has same value as F_SETLKW, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
            
            
            return 0; // Pretend that the locking is successful.
          case 16:
          case 8:
            return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
          case 9:
            // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          default: {
            return -ERRNO_CODES.EINVAL;
          }
        }
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // open
        var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // ioctl
        var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
        switch (op) {
          case 21509:
          case 21505: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0; // no-op, not actually adjusting terminal settings
          }
          case 21519: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            var argp = SYSCALLS.get();
            HEAP32[((argp)>>2)]=0;
            return 0;
          }
          case 21520: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return -ERRNO_CODES.EINVAL; // not supported
          }
          case 21531: {
            var argp = SYSCALLS.get();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            // TODO: in theory we should write to the winsize struct that gets
            // passed in, but for now musl doesn't read anything on it
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0;
          }
          case 21524: {
            // TODO: technically, this ioctl call should change the window size.
            // but, since emscripten doesn't have any concept of a terminal window
            // yet, we'll just silently throw it away as we do TIOCGWINSZ
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0;
          }
          default: abort('bad ioctl syscall ' + op);
        }
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
    try {
     // close
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0;
      } catch (e) {
      if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
      return -e.errno;
    }
    }
  
    function ___unlock() {}
  
    
    var tupleRegistrations={};
    
    function runDestructors(destructors) {
        while (destructors.length) {
            var ptr = destructors.pop();
            var del = destructors.pop();
            del(ptr);
        }
      }
    
    function simpleReadValueFromPointer(pointer) {
        return this['fromWireType'](HEAPU32[pointer >> 2]);
      }
    
    
    var awaitingDependencies={};
    
    var registeredTypes={};
    
    var typeDependencies={};
    
    
    
    
    
    
    var char_0=48;
    
    var char_9=57;function makeLegalFunctionName(name) {
        if (undefined === name) {
            return '_unknown';
        }
        name = name.replace(/[^a-zA-Z0-9_]/g, '$');
        var f = name.charCodeAt(0);
        if (f >= char_0 && f <= char_9) {
            return '_' + name;
        } else {
            return name;
        }
      }function createNamedFunction(name, body) {
        name = makeLegalFunctionName(name);
        /*jshint evil:true*/
        return new Function(
            "body",
            "return function " + name + "() {\n" +
            "    \"use strict\";" +
            "    return body.apply(this, arguments);\n" +
            "};\n"
        )(body);
      }function extendError(baseErrorType, errorName) {
        var errorClass = createNamedFunction(errorName, function(message) {
            this.name = errorName;
            this.message = message;
    
            var stack = (new Error(message)).stack;
            if (stack !== undefined) {
                this.stack = this.toString() + '\n' +
                    stack.replace(/^Error(:[^\n]*)?\n/, '');
            }
        });
        errorClass.prototype = Object.create(baseErrorType.prototype);
        errorClass.prototype.constructor = errorClass;
        errorClass.prototype.toString = function() {
            if (this.message === undefined) {
                return this.name;
            } else {
                return this.name + ': ' + this.message;
            }
        };
    
        return errorClass;
      }var InternalError=undefined;function throwInternalError(message) {
        throw new InternalError(message);
      }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
        myTypes.forEach(function(type) {
            typeDependencies[type] = dependentTypes;
        });
    
        function onComplete(typeConverters) {
            var myTypeConverters = getTypeConverters(typeConverters);
            if (myTypeConverters.length !== myTypes.length) {
                throwInternalError('Mismatched type converter count');
            }
            for (var i = 0; i < myTypes.length; ++i) {
                registerType(myTypes[i], myTypeConverters[i]);
            }
        }
    
        var typeConverters = new Array(dependentTypes.length);
        var unregisteredTypes = [];
        var registered = 0;
        dependentTypes.forEach(function(dt, i) {
            if (registeredTypes.hasOwnProperty(dt)) {
                typeConverters[i] = registeredTypes[dt];
            } else {
                unregisteredTypes.push(dt);
                if (!awaitingDependencies.hasOwnProperty(dt)) {
                    awaitingDependencies[dt] = [];
                }
                awaitingDependencies[dt].push(function() {
                    typeConverters[i] = registeredTypes[dt];
                    ++registered;
                    if (registered === unregisteredTypes.length) {
                        onComplete(typeConverters);
                    }
                });
            }
        });
        if (0 === unregisteredTypes.length) {
            onComplete(typeConverters);
        }
      }function __embind_finalize_value_array(rawTupleType) {
        var reg = tupleRegistrations[rawTupleType];
        delete tupleRegistrations[rawTupleType];
        var elements = reg.elements;
        var elementsLength = elements.length;
        var elementTypes = elements.map(function(elt) { return elt.getterReturnType; }).
                    concat(elements.map(function(elt) { return elt.setterArgumentType; }));
    
        var rawConstructor = reg.rawConstructor;
        var rawDestructor = reg.rawDestructor;
    
        whenDependentTypesAreResolved([rawTupleType], elementTypes, function(elementTypes) {
            elements.forEach(function(elt, i) {
                var getterReturnType = elementTypes[i];
                var getter = elt.getter;
                var getterContext = elt.getterContext;
                var setterArgumentType = elementTypes[i + elementsLength];
                var setter = elt.setter;
                var setterContext = elt.setterContext;
                elt.read = function(ptr) {
                    return getterReturnType['fromWireType'](getter(getterContext, ptr));
                };
                elt.write = function(ptr, o) {
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                    runDestructors(destructors);
                };
            });
    
            return [{
                name: reg.name,
                'fromWireType': function(ptr) {
                    var rv = new Array(elementsLength);
                    for (var i = 0; i < elementsLength; ++i) {
                        rv[i] = elements[i].read(ptr);
                    }
                    rawDestructor(ptr);
                    return rv;
                },
                'toWireType': function(destructors, o) {
                    if (elementsLength !== o.length) {
                        throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length);
                    }
                    var ptr = rawConstructor();
                    for (var i = 0; i < elementsLength; ++i) {
                        elements[i].write(ptr, o[i]);
                    }
                    if (destructors !== null) {
                        destructors.push(rawDestructor, ptr);
                    }
                    return ptr;
                },
                'argPackAdvance': 8,
                'readValueFromPointer': simpleReadValueFromPointer,
                destructorFunction: rawDestructor,
            }];
        });
      }
  
    
    var structRegistrations={};function __embind_finalize_value_object(structType) {
        var reg = structRegistrations[structType];
        delete structRegistrations[structType];
    
        var rawConstructor = reg.rawConstructor;
        var rawDestructor = reg.rawDestructor;
        var fieldRecords = reg.fields;
        var fieldTypes = fieldRecords.map(function(field) { return field.getterReturnType; }).
                  concat(fieldRecords.map(function(field) { return field.setterArgumentType; }));
        whenDependentTypesAreResolved([structType], fieldTypes, function(fieldTypes) {
            var fields = {};
            fieldRecords.forEach(function(field, i) {
                var fieldName = field.fieldName;
                var getterReturnType = fieldTypes[i];
                var getter = field.getter;
                var getterContext = field.getterContext;
                var setterArgumentType = fieldTypes[i + fieldRecords.length];
                var setter = field.setter;
                var setterContext = field.setterContext;
                fields[fieldName] = {
                    read: function(ptr) {
                        return getterReturnType['fromWireType'](
                            getter(getterContext, ptr));
                    },
                    write: function(ptr, o) {
                        var destructors = [];
                        setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, o));
                        runDestructors(destructors);
                    }
                };
            });
    
            return [{
                name: reg.name,
                'fromWireType': function(ptr) {
                    var rv = {};
                    for (var i in fields) {
                        rv[i] = fields[i].read(ptr);
                    }
                    rawDestructor(ptr);
                    return rv;
                },
                'toWireType': function(destructors, o) {
                    // todo: Here we have an opportunity for -O3 level "unsafe" optimizations:
                    // assume all fields are present without checking.
                    for (var fieldName in fields) {
                        if (!(fieldName in o)) {
                            throw new TypeError('Missing field');
                        }
                    }
                    var ptr = rawConstructor();
                    for (fieldName in fields) {
                        fields[fieldName].write(ptr, o[fieldName]);
                    }
                    if (destructors !== null) {
                        destructors.push(rawDestructor, ptr);
                    }
                    return ptr;
                },
                'argPackAdvance': 8,
                'readValueFromPointer': simpleReadValueFromPointer,
                destructorFunction: rawDestructor,
            }];
        });
      }
  
    
    function getShiftFromSize(size) {
        switch (size) {
            case 1: return 0;
            case 2: return 1;
            case 4: return 2;
            case 8: return 3;
            default:
                throw new TypeError('Unknown type size: ' + size);
        }
      }
    
    
    
    function embind_init_charCodes() {
        var codes = new Array(256);
        for (var i = 0; i < 256; ++i) {
            codes[i] = String.fromCharCode(i);
        }
        embind_charCodes = codes;
      }var embind_charCodes=undefined;function readLatin1String(ptr) {
        var ret = "";
        var c = ptr;
        while (HEAPU8[c]) {
            ret += embind_charCodes[HEAPU8[c++]];
        }
        return ret;
      }
    
    
    
    var BindingError=undefined;function throwBindingError(message) {
        throw new BindingError(message);
      }function registerType(rawType, registeredInstance, options) {
        options = options || {};
    
        if (!('argPackAdvance' in registeredInstance)) {
            throw new TypeError('registerType registeredInstance requires argPackAdvance');
        }
    
        var name = registeredInstance.name;
        if (!rawType) {
            throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
        }
        if (registeredTypes.hasOwnProperty(rawType)) {
            if (options.ignoreDuplicateRegistrations) {
                return;
            } else {
                throwBindingError("Cannot register type '" + name + "' twice");
            }
        }
    
        registeredTypes[rawType] = registeredInstance;
        delete typeDependencies[rawType];
    
        if (awaitingDependencies.hasOwnProperty(rawType)) {
            var callbacks = awaitingDependencies[rawType];
            delete awaitingDependencies[rawType];
            callbacks.forEach(function(cb) {
                cb();
            });
        }
      }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
        var shift = getShiftFromSize(size);
    
        name = readLatin1String(name);
        registerType(rawType, {
            name: name,
            'fromWireType': function(wt) {
                // ambiguous emscripten ABI: sometimes return values are
                // true or false, and sometimes integers (0 or 1)
                return !!wt;
            },
            'toWireType': function(destructors, o) {
                return o ? trueValue : falseValue;
            },
            'argPackAdvance': 8,
            'readValueFromPointer': function(pointer) {
                // TODO: if heap is fixed (like in asm.js) this could be executed outside
                var heap;
                if (size === 1) {
                    heap = HEAP8;
                } else if (size === 2) {
                    heap = HEAP16;
                } else if (size === 4) {
                    heap = HEAP32;
                } else {
                    throw new TypeError("Unknown boolean type size: " + name);
                }
                return this['fromWireType'](heap[pointer >> shift]);
            },
            destructorFunction: null, // This type does not need a destructor
        });
      }
  
    
    
    
    function ClassHandle_isAliasOf(other) {
        if (!(this instanceof ClassHandle)) {
            return false;
        }
        if (!(other instanceof ClassHandle)) {
            return false;
        }
    
        var leftClass = this.$$.ptrType.registeredClass;
        var left = this.$$.ptr;
        var rightClass = other.$$.ptrType.registeredClass;
        var right = other.$$.ptr;
    
        while (leftClass.baseClass) {
            left = leftClass.upcast(left);
            leftClass = leftClass.baseClass;
        }
    
        while (rightClass.baseClass) {
            right = rightClass.upcast(right);
            rightClass = rightClass.baseClass;
        }
    
        return leftClass === rightClass && left === right;
      }
    
    
    function shallowCopyInternalPointer(o) {
        return {
            count: o.count,
            deleteScheduled: o.deleteScheduled,
            preservePointerOnDelete: o.preservePointerOnDelete,
            ptr: o.ptr,
            ptrType: o.ptrType,
            smartPtr: o.smartPtr,
            smartPtrType: o.smartPtrType,
        };
      }
    
    function throwInstanceAlreadyDeleted(obj) {
        function getInstanceTypeName(handle) {
          return handle.$$.ptrType.registeredClass.name;
        }
        throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
      }function ClassHandle_clone() {
        if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        }
    
        if (this.$$.preservePointerOnDelete) {
            this.$$.count.value += 1;
            return this;
        } else {
            var clone = Object.create(Object.getPrototypeOf(this), {
                $$: {
                    value: shallowCopyInternalPointer(this.$$),
                }
            });
    
            clone.$$.count.value += 1;
            clone.$$.deleteScheduled = false;
            return clone;
        }
      }
    
    
    function runDestructor(handle) {
        var $$ = handle.$$;
        if ($$.smartPtr) {
            $$.smartPtrType.rawDestructor($$.smartPtr);
        } else {
            $$.ptrType.registeredClass.rawDestructor($$.ptr);
        }
      }function ClassHandle_delete() {
        if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        }
    
        if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError('Object already scheduled for deletion');
        }
    
        this.$$.count.value -= 1;
        var toDelete = 0 === this.$$.count.value;
        if (toDelete) {
            runDestructor(this);
        }
        if (!this.$$.preservePointerOnDelete) {
            this.$$.smartPtr = undefined;
            this.$$.ptr = undefined;
        }
      }
    
    function ClassHandle_isDeleted() {
        return !this.$$.ptr;
      }
    
    
    var delayFunction=undefined;
    
    var deletionQueue=[];
    
    function flushPendingDeletes() {
        while (deletionQueue.length) {
            var obj = deletionQueue.pop();
            obj.$$.deleteScheduled = false;
            obj['delete']();
        }
      }function ClassHandle_deleteLater() {
        if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
        }
        if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError('Object already scheduled for deletion');
        }
        deletionQueue.push(this);
        if (deletionQueue.length === 1 && delayFunction) {
            delayFunction(flushPendingDeletes);
        }
        this.$$.deleteScheduled = true;
        return this;
      }function init_ClassHandle() {
        ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
        ClassHandle.prototype['clone'] = ClassHandle_clone;
        ClassHandle.prototype['delete'] = ClassHandle_delete;
        ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
        ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
      }function ClassHandle() {
      }
    
    var registeredPointers={};
    
    
    function ensureOverloadTable(proto, methodName, humanName) {
        if (undefined === proto[methodName].overloadTable) {
            var prevFunc = proto[methodName];
            // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
            proto[methodName] = function() {
                // TODO This check can be removed in -O3 level "unsafe" optimizations.
                if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
                }
                return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
            };
            // Move the previous function into the overload table.
            proto[methodName].overloadTable = [];
            proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
        }
      }function exposePublicSymbol(name, value, numArguments) {
        if (Module.hasOwnProperty(name)) {
            if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
                throwBindingError("Cannot register public name '" + name + "' twice");
            }
    
            // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
            // that routes between the two.
            ensureOverloadTable(Module, name, name);
            if (Module.hasOwnProperty(numArguments)) {
                throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
            }
            // Add the new function into the overload table.
            Module[name].overloadTable[numArguments] = value;
        }
        else {
            Module[name] = value;
            if (undefined !== numArguments) {
                Module[name].numArguments = numArguments;
            }
        }
      }
    
    function RegisteredClass(
        name,
        constructor,
        instancePrototype,
        rawDestructor,
        baseClass,
        getActualType,
        upcast,
        downcast
      ) {
        this.name = name;
        this.constructor = constructor;
        this.instancePrototype = instancePrototype;
        this.rawDestructor = rawDestructor;
        this.baseClass = baseClass;
        this.getActualType = getActualType;
        this.upcast = upcast;
        this.downcast = downcast;
        this.pureVirtualFunctions = [];
      }
    
    
    
    function upcastPointer(ptr, ptrClass, desiredClass) {
        while (ptrClass !== desiredClass) {
            if (!ptrClass.upcast) {
                throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
            }
            ptr = ptrClass.upcast(ptr);
            ptrClass = ptrClass.baseClass;
        }
        return ptr;
      }function constNoSmartPtrRawPointerToWireType(destructors, handle) {
        if (handle === null) {
            if (this.isReference) {
                throwBindingError('null is not a valid ' + this.name);
            }
            return 0;
        }
    
        if (!handle.$$) {
            throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
        }
        if (!handle.$$.ptr) {
            throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
        }
        var handleClass = handle.$$.ptrType.registeredClass;
        var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
        return ptr;
      }
    
    function genericPointerToWireType(destructors, handle) {
        var ptr;
        if (handle === null) {
            if (this.isReference) {
                throwBindingError('null is not a valid ' + this.name);
            }
    
            if (this.isSmartPointer) {
                ptr = this.rawConstructor();
                if (destructors !== null) {
                    destructors.push(this.rawDestructor, ptr);
                }
                return ptr;
            } else {
                return 0;
            }
        }
    
        if (!handle.$$) {
            throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
        }
        if (!handle.$$.ptr) {
            throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
        }
        if (!this.isConst && handle.$$.ptrType.isConst) {
            throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
        }
        var handleClass = handle.$$.ptrType.registeredClass;
        ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    
        if (this.isSmartPointer) {
            // TODO: this is not strictly true
            // We could support BY_EMVAL conversions from raw pointers to smart pointers
            // because the smart pointer can hold a reference to the handle
            if (undefined === handle.$$.smartPtr) {
                throwBindingError('Passing raw pointer to smart pointer is illegal');
            }
    
            switch (this.sharingPolicy) {
                case 0: // NONE
                    // no upcasting
                    if (handle.$$.smartPtrType === this) {
                        ptr = handle.$$.smartPtr;
                    } else {
                        throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                    }
                    break;
    
                case 1: // INTRUSIVE
                    ptr = handle.$$.smartPtr;
                    break;
    
                case 2: // BY_EMVAL
                    if (handle.$$.smartPtrType === this) {
                        ptr = handle.$$.smartPtr;
                    } else {
                        var clonedHandle = handle['clone']();
                        ptr = this.rawShare(
                            ptr,
                            __emval_register(function() {
                                clonedHandle['delete']();
                            })
                        );
                        if (destructors !== null) {
                            destructors.push(this.rawDestructor, ptr);
                        }
                    }
                    break;
    
                default:
                    throwBindingError('Unsupporting sharing policy');
            }
        }
        return ptr;
      }
    
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
        if (handle === null) {
            if (this.isReference) {
                throwBindingError('null is not a valid ' + this.name);
            }
            return 0;
        }
    
        if (!handle.$$) {
            throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
        }
        if (!handle.$$.ptr) {
            throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
        }
        if (handle.$$.ptrType.isConst) {
            throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
        }
        var handleClass = handle.$$.ptrType.registeredClass;
        var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
        return ptr;
      }
    
    
    function RegisteredPointer_getPointee(ptr) {
        if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr);
        }
        return ptr;
      }
    
    function RegisteredPointer_destructor(ptr) {
        if (this.rawDestructor) {
            this.rawDestructor(ptr);
        }
      }
    
    function RegisteredPointer_deleteObject(handle) {
        if (handle !== null) {
            handle['delete']();
        }
      }
    
    
    function downcastPointer(ptr, ptrClass, desiredClass) {
        if (ptrClass === desiredClass) {
            return ptr;
        }
        if (undefined === desiredClass.baseClass) {
            return null; // no conversion
        }
    
        var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
        if (rv === null) {
            return null;
        }
        return desiredClass.downcast(rv);
      }
    
    
    
    
    function getInheritedInstanceCount() {
        return Object.keys(registeredInstances).length;
      }
    
    function getLiveInheritedInstances() {
        var rv = [];
        for (var k in registeredInstances) {
            if (registeredInstances.hasOwnProperty(k)) {
                rv.push(registeredInstances[k]);
            }
        }
        return rv;
      }
    
    function setDelayFunction(fn) {
        delayFunction = fn;
        if (deletionQueue.length && delayFunction) {
            delayFunction(flushPendingDeletes);
        }
      }function init_embind() {
        Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
        Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
        Module['flushPendingDeletes'] = flushPendingDeletes;
        Module['setDelayFunction'] = setDelayFunction;
      }var registeredInstances={};
    
    function getBasestPointer(class_, ptr) {
        if (ptr === undefined) {
            throwBindingError('ptr should not be undefined');
        }
        while (class_.baseClass) {
            ptr = class_.upcast(ptr);
            class_ = class_.baseClass;
        }
        return ptr;
      }function getInheritedInstance(class_, ptr) {
        ptr = getBasestPointer(class_, ptr);
        return registeredInstances[ptr];
      }
    
    function makeClassHandle(prototype, record) {
        if (!record.ptrType || !record.ptr) {
            throwInternalError('makeClassHandle requires ptr and ptrType');
        }
        var hasSmartPtrType = !!record.smartPtrType;
        var hasSmartPtr = !!record.smartPtr;
        if (hasSmartPtrType !== hasSmartPtr) {
            throwInternalError('Both smartPtrType and smartPtr must be specified');
        }
        record.count = { value: 1 };
        return Object.create(prototype, {
            $$: {
                value: record,
            },
        });
      }function RegisteredPointer_fromWireType(ptr) {
        // ptr is a raw pointer (or a raw smartpointer)
    
        // rawPointer is a maybe-null raw pointer
        var rawPointer = this.getPointee(ptr);
        if (!rawPointer) {
            this.destructor(ptr);
            return null;
        }
    
        var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
        if (undefined !== registeredInstance) {
            // JS object has been neutered, time to repopulate it
            if (0 === registeredInstance.$$.count.value) {
                registeredInstance.$$.ptr = rawPointer;
                registeredInstance.$$.smartPtr = ptr;
                return registeredInstance['clone']();
            } else {
                // else, just increment reference count on existing object
                // it already has a reference to the smart pointer
                var rv = registeredInstance['clone']();
                this.destructor(ptr);
                return rv;
            }
        }
    
        function makeDefaultHandle() {
            if (this.isSmartPointer) {
                return makeClassHandle(this.registeredClass.instancePrototype, {
                    ptrType: this.pointeeType,
                    ptr: rawPointer,
                    smartPtrType: this,
                    smartPtr: ptr,
                });
            } else {
                return makeClassHandle(this.registeredClass.instancePrototype, {
                    ptrType: this,
                    ptr: ptr,
                });
            }
        }
    
        var actualType = this.registeredClass.getActualType(rawPointer);
        var registeredPointerRecord = registeredPointers[actualType];
        if (!registeredPointerRecord) {
            return makeDefaultHandle.call(this);
        }
    
        var toType;
        if (this.isConst) {
            toType = registeredPointerRecord.constPointerType;
        } else {
            toType = registeredPointerRecord.pointerType;
        }
        var dp = downcastPointer(
            rawPointer,
            this.registeredClass,
            toType.registeredClass);
        if (dp === null) {
            return makeDefaultHandle.call(this);
        }
        if (this.isSmartPointer) {
            return makeClassHandle(toType.registeredClass.instancePrototype, {
                ptrType: toType,
                ptr: dp,
                smartPtrType: this,
                smartPtr: ptr,
            });
        } else {
            return makeClassHandle(toType.registeredClass.instancePrototype, {
                ptrType: toType,
                ptr: dp,
            });
        }
      }function init_RegisteredPointer() {
        RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
        RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
        RegisteredPointer.prototype['argPackAdvance'] = 8;
        RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
        RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
        RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
      }function RegisteredPointer(
        name,
        registeredClass,
        isReference,
        isConst,
    
        // smart pointer properties
        isSmartPointer,
        pointeeType,
        sharingPolicy,
        rawGetPointee,
        rawConstructor,
        rawShare,
        rawDestructor
      ) {
        this.name = name;
        this.registeredClass = registeredClass;
        this.isReference = isReference;
        this.isConst = isConst;
    
        // smart pointer properties
        this.isSmartPointer = isSmartPointer;
        this.pointeeType = pointeeType;
        this.sharingPolicy = sharingPolicy;
        this.rawGetPointee = rawGetPointee;
        this.rawConstructor = rawConstructor;
        this.rawShare = rawShare;
        this.rawDestructor = rawDestructor;
    
        if (!isSmartPointer && registeredClass.baseClass === undefined) {
            if (isConst) {
                this['toWireType'] = constNoSmartPtrRawPointerToWireType;
                this.destructorFunction = null;
            } else {
                this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
                this.destructorFunction = null;
            }
        } else {
            this['toWireType'] = genericPointerToWireType;
            // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
            // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
            // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
            //       craftInvokerFunction altogether.
        }
      }
    
    function replacePublicSymbol(name, value, numArguments) {
        if (!Module.hasOwnProperty(name)) {
            throwInternalError('Replacing nonexistant public symbol');
        }
        // If there's an overload table for this symbol, replace the symbol in the overload table instead.
        if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
            Module[name].overloadTable[numArguments] = value;
        }
        else {
            Module[name] = value;
            Module[name].argCount = numArguments;
        }
      }
    
    function embind__requireFunction(signature, rawFunction) {
        signature = readLatin1String(signature);
    
        function makeDynCaller(dynCall) {
            var args = [];
            for (var i = 1; i < signature.length; ++i) {
                args.push('a' + i);
            }
    
            var name = 'dynCall_' + signature + '_' + rawFunction;
            var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
            body    += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
            body    += '};\n';
    
            return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
        }
    
        var fp;
        if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
            fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
        } else if (typeof FUNCTION_TABLE !== "undefined") {
            fp = FUNCTION_TABLE[rawFunction];
        } else {
            // asm.js does not give direct access to the function tables,
            // and thus we must go through the dynCall interface which allows
            // calling into a signature's function table by pointer value.
            //
            // https://github.com/dherman/asm.js/issues/83
            //
            // This has three main penalties:
            // - dynCall is another function call in the path from JavaScript to C++.
            // - JITs may not predict through the function table indirection at runtime.
            var dc = Module['dynCall_' + signature];
            if (dc === undefined) {
                // We will always enter this branch if the signature
                // contains 'f' and PRECISE_F32 is not enabled.
                //
                // Try again, replacing 'f' with 'd'.
                dc = Module['dynCall_' + signature.replace(/f/g, 'd')];
                if (dc === undefined) {
                    throwBindingError("No dynCall invoker for signature: " + signature);
                }
            }
            fp = makeDynCaller(dc);
        }
    
        if (typeof fp !== "function") {
            throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
        }
        return fp;
      }
    
    
    var UnboundTypeError=undefined;
    
    function getTypeName(type) {
        var ptr = ___getTypeName(type);
        var rv = readLatin1String(ptr);
        _free(ptr);
        return rv;
      }function throwUnboundTypeError(message, types) {
        var unboundTypes = [];
        var seen = {};
        function visit(type) {
            if (seen[type]) {
                return;
            }
            if (registeredTypes[type]) {
                return;
            }
            if (typeDependencies[type]) {
                typeDependencies[type].forEach(visit);
                return;
            }
            unboundTypes.push(type);
            seen[type] = true;
        }
        types.forEach(visit);
    
        throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
      }function __embind_register_class(
        rawType,
        rawPointerType,
        rawConstPointerType,
        baseClassRawType,
        getActualTypeSignature,
        getActualType,
        upcastSignature,
        upcast,
        downcastSignature,
        downcast,
        name,
        destructorSignature,
        rawDestructor
      ) {
        name = readLatin1String(name);
        getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
        if (upcast) {
            upcast = embind__requireFunction(upcastSignature, upcast);
        }
        if (downcast) {
            downcast = embind__requireFunction(downcastSignature, downcast);
        }
        rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
        var legalFunctionName = makeLegalFunctionName(name);
    
        exposePublicSymbol(legalFunctionName, function() {
            // this code cannot run if baseClassRawType is zero
            throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
        });
    
        whenDependentTypesAreResolved(
            [rawType, rawPointerType, rawConstPointerType],
            baseClassRawType ? [baseClassRawType] : [],
            function(base) {
                base = base[0];
    
                var baseClass;
                var basePrototype;
                if (baseClassRawType) {
                    baseClass = base.registeredClass;
                    basePrototype = baseClass.instancePrototype;
                } else {
                    basePrototype = ClassHandle.prototype;
                }
    
                var constructor = createNamedFunction(legalFunctionName, function() {
                    if (Object.getPrototypeOf(this) !== instancePrototype) {
                        throw new BindingError("Use 'new' to construct " + name);
                    }
                    if (undefined === registeredClass.constructor_body) {
                        throw new BindingError(name + " has no accessible constructor");
                    }
                    var body = registeredClass.constructor_body[arguments.length];
                    if (undefined === body) {
                        throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
                    }
                    return body.apply(this, arguments);
                });
    
                var instancePrototype = Object.create(basePrototype, {
                    constructor: { value: constructor },
                });
    
                constructor.prototype = instancePrototype;
    
                var registeredClass = new RegisteredClass(
                    name,
                    constructor,
                    instancePrototype,
                    rawDestructor,
                    baseClass,
                    getActualType,
                    upcast,
                    downcast);
    
                var referenceConverter = new RegisteredPointer(
                    name,
                    registeredClass,
                    true,
                    false,
                    false);
    
                var pointerConverter = new RegisteredPointer(
                    name + '*',
                    registeredClass,
                    false,
                    false,
                    false);
    
                var constPointerConverter = new RegisteredPointer(
                    name + ' const*',
                    registeredClass,
                    false,
                    true,
                    false);
    
                registeredPointers[rawType] = {
                    pointerType: pointerConverter,
                    constPointerType: constPointerConverter
                };
    
                replacePublicSymbol(legalFunctionName, constructor);
    
                return [referenceConverter, pointerConverter, constPointerConverter];
            }
        );
      }
  
    
    
    function new_(constructor, argumentList) {
        if (!(constructor instanceof Function)) {
            throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
        }
    
        /*
         * Previously, the following line was just:
    
         function dummy() {};
    
         * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
         * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
         * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
         * to write a test for this behavior.  -NRD 2013.02.22
         */
        var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
        dummy.prototype = constructor.prototype;
        var obj = new dummy;
    
        var r = constructor.apply(obj, argumentList);
        return (r instanceof Object) ? r : obj;
      }function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
        // humanName: a human-readable string name for the function to be generated.
        // argTypes: An array that contains the embind type objects for all types in the function signature.
        //    argTypes[0] is the type object for the function return value.
        //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
        //    argTypes[2...] are the actual function parameters.
        // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
        // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
        // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
        var argCount = argTypes.length;
    
        if (argCount < 2) {
            throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
        }
    
        var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
    
        // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
    // TODO: This omits argument count check - enable only at -O3 or similar.
    //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
    //       return FUNCTION_TABLE[fn];
    //    }
    
    
        // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
        // TODO: Remove this completely once all function invokers are being dynamically generated.
        var needsDestructorStack = false;
    
        for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
            if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
                needsDestructorStack = true;
                break;
            }
        }
    
        var returns = (argTypes[0].name !== "void");
    
        var argsList = "";
        var argsListWired = "";
        for(var i = 0; i < argCount - 2; ++i) {
            argsList += (i!==0?", ":"")+"arg"+i;
            argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
        }
    
        var invokerFnBody =
            "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
            "if (arguments.length !== "+(argCount - 2)+") {\n" +
                "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
            "}\n";
    
    
        if (needsDestructorStack) {
            invokerFnBody +=
                "var destructors = [];\n";
        }
    
        var dtorStack = needsDestructorStack ? "destructors" : "null";
        var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
        var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    
    
        if (isClassMethodFunc) {
            invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
        }
    
        for(var i = 0; i < argCount - 2; ++i) {
            invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
            args1.push("argType"+i);
            args2.push(argTypes[i+2]);
        }
    
        if (isClassMethodFunc) {
            argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
        }
    
        invokerFnBody +=
            (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
    
        if (needsDestructorStack) {
            invokerFnBody += "runDestructors(destructors);\n";
        } else {
            for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
                var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
                if (argTypes[i].destructorFunction !== null) {
                    invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                    args1.push(paramName+"_dtor");
                    args2.push(argTypes[i].destructorFunction);
                }
            }
        }
    
        if (returns) {
            invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                             "return ret;\n";
        } else {
        }
        invokerFnBody += "}\n";
    
        args1.push(invokerFnBody);
    
        var invokerFunction = new_(Function, args1).apply(null, args2);
        return invokerFunction;
      }
    
    function heap32VectorToArray(count, firstElement) {
        var array = [];
        for (var i = 0; i < count; i++) {
            array.push(HEAP32[(firstElement >> 2) + i]);
        }
        return array;
      }function __embind_register_class_class_function(
        rawClassType,
        methodName,
        argCount,
        rawArgTypesAddr,
        invokerSignature,
        rawInvoker,
        fn
      ) {
        var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
        methodName = readLatin1String(methodName);
        rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
        whenDependentTypesAreResolved([], [rawClassType], function(classType) {
            classType = classType[0];
            var humanName = classType.name + '.' + methodName;
    
            function unboundTypesHandler() {
                throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
            }
    
            var proto = classType.registeredClass.constructor;
            if (undefined === proto[methodName]) {
                // This is the first function to be registered with this name.
                unboundTypesHandler.argCount = argCount-1;
                proto[methodName] = unboundTypesHandler;
            } else {
                // There was an existing function with the same name registered. Set up a function overload routing table.
                ensureOverloadTable(proto, methodName, humanName);
                proto[methodName].overloadTable[argCount-1] = unboundTypesHandler;
            }
    
            whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
                // Replace the initial unbound-types-handler stub with the proper function. If multiple overloads are registered,
                // the function handlers go into an overload table.
                var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
                var func = craftInvokerFunction(humanName, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn);
                if (undefined === proto[methodName].overloadTable) {
                    func.argCount = argCount-1;
                    proto[methodName] = func;
                } else {
                    proto[methodName].overloadTable[argCount-1] = func;
                }
                return [];
            });
            return [];
        });
      }
  
    function __embind_register_class_constructor(
        rawClassType,
        argCount,
        rawArgTypesAddr,
        invokerSignature,
        invoker,
        rawConstructor
      ) {
        var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
        invoker = embind__requireFunction(invokerSignature, invoker);
    
        whenDependentTypesAreResolved([], [rawClassType], function(classType) {
            classType = classType[0];
            var humanName = 'constructor ' + classType.name;
    
            if (undefined === classType.registeredClass.constructor_body) {
                classType.registeredClass.constructor_body = [];
            }
            if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
            }
            classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
            };
    
            whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
                classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                    if (arguments.length !== argCount - 1) {
                        throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                    }
                    var destructors = [];
                    var args = new Array(argCount);
                    args[0] = rawConstructor;
                    for (var i = 1; i < argCount; ++i) {
                        args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                    }
    
                    var ptr = invoker.apply(null, args);
                    runDestructors(destructors);
    
                    return argTypes[0]['fromWireType'](ptr);
                };
                return [];
            });
            return [];
        });
      }
  
    function __embind_register_class_function(
        rawClassType,
        methodName,
        argCount,
        rawArgTypesAddr, // [ReturnType, ThisType, Args...]
        invokerSignature,
        rawInvoker,
        context,
        isPureVirtual
      ) {
        var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
        methodName = readLatin1String(methodName);
        rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
    
        whenDependentTypesAreResolved([], [rawClassType], function(classType) {
            classType = classType[0];
            var humanName = classType.name + '.' + methodName;
    
            if (isPureVirtual) {
                classType.registeredClass.pureVirtualFunctions.push(methodName);
            }
    
            function unboundTypesHandler() {
                throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
            }
    
            var proto = classType.registeredClass.instancePrototype;
            var method = proto[methodName];
            if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
                // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
                unboundTypesHandler.argCount = argCount - 2;
                unboundTypesHandler.className = classType.name;
                proto[methodName] = unboundTypesHandler;
            } else {
                // There was an existing function with the same name registered. Set up a function overload routing table.
                ensureOverloadTable(proto, methodName, humanName);
                proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
            }
    
            whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
    
                var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
    
                // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
                // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
                if (undefined === proto[methodName].overloadTable) {
                    // Set argCount in case an overload is registered later
                    memberFunction.argCount = argCount - 2;
                    proto[methodName] = memberFunction;
                } else {
                    proto[methodName].overloadTable[argCount - 2] = memberFunction;
                }
    
                return [];
            });
            return [];
        });
      }
  
    
    function validateThis(this_, classType, humanName) {
        if (!(this_ instanceof Object)) {
            throwBindingError(humanName + ' with invalid "this": ' + this_);
        }
        if (!(this_ instanceof classType.registeredClass.constructor)) {
            throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
        }
        if (!this_.$$.ptr) {
            throwBindingError('cannot call emscripten binding method ' + humanName + ' on deleted object');
        }
    
        // todo: kill this
        return upcastPointer(
            this_.$$.ptr,
            this_.$$.ptrType.registeredClass,
            classType.registeredClass);
      }function __embind_register_class_property(
        classType,
        fieldName,
        getterReturnType,
        getterSignature,
        getter,
        getterContext,
        setterArgumentType,
        setterSignature,
        setter,
        setterContext
      ) {
        fieldName = readLatin1String(fieldName);
        getter = embind__requireFunction(getterSignature, getter);
    
        whenDependentTypesAreResolved([], [classType], function(classType) {
            classType = classType[0];
            var humanName = classType.name + '.' + fieldName;
            var desc = {
                get: function() {
                    throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
                },
                enumerable: true,
                configurable: true
            };
            if (setter) {
                desc.set = function() {
                    throwUnboundTypeError('Cannot access ' + humanName + ' due to unbound types', [getterReturnType, setterArgumentType]);
                };
            } else {
                desc.set = function(v) {
                    throwBindingError(humanName + ' is a read-only property');
                };
            }
    
            Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
    
            whenDependentTypesAreResolved(
                [],
                (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
            function(types) {
                var getterReturnType = types[0];
                var desc = {
                    get: function() {
                        var ptr = validateThis(this, classType, humanName + ' getter');
                        return getterReturnType['fromWireType'](getter(getterContext, ptr));
                    },
                    enumerable: true
                };
    
                if (setter) {
                    setter = embind__requireFunction(setterSignature, setter);
                    var setterArgumentType = types[1];
                    desc.set = function(v) {
                        var ptr = validateThis(this, classType, humanName + ' setter');
                        var destructors = [];
                        setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
                        runDestructors(destructors);
                    };
                }
    
                Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
                return [];
            });
    
            return [];
        });
      }
  
    
    
    var emval_free_list=[];
    
    var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
        if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
            emval_handle_array[handle] = undefined;
            emval_free_list.push(handle);
        }
      }
    
    
    
    function count_emval_handles() {
        var count = 0;
        for (var i = 5; i < emval_handle_array.length; ++i) {
            if (emval_handle_array[i] !== undefined) {
                ++count;
            }
        }
        return count;
      }
    
    function get_first_emval() {
        for (var i = 5; i < emval_handle_array.length; ++i) {
            if (emval_handle_array[i] !== undefined) {
                return emval_handle_array[i];
            }
        }
        return null;
      }function init_emval() {
        Module['count_emval_handles'] = count_emval_handles;
        Module['get_first_emval'] = get_first_emval;
      }function __emval_register(value) {
    
        switch(value){
          case undefined :{ return 1; }
          case null :{ return 2; }
          case true :{ return 3; }
          case false :{ return 4; }
          default:{
            var handle = emval_free_list.length ?
                emval_free_list.pop() :
                emval_handle_array.length;
    
            emval_handle_array[handle] = {refcount: 1, value: value};
            return handle;
            }
          }
      }function __embind_register_emval(rawType, name) {
        name = readLatin1String(name);
        registerType(rawType, {
            name: name,
            'fromWireType': function(handle) {
                var rv = emval_handle_array[handle].value;
                __emval_decref(handle);
                return rv;
            },
            'toWireType': function(destructors, value) {
                return __emval_register(value);
            },
            'argPackAdvance': 8,
            'readValueFromPointer': simpleReadValueFromPointer,
            destructorFunction: null, // This type does not need a destructor
    
            // TODO: do we need a deleteObject here?  write a test where
            // emval is passed into JS via an interface
        });
      }
  
    
    function enumReadValueFromPointer(name, shift, signed) {
        switch (shift) {
            case 0: return function(pointer) {
                var heap = signed ? HEAP8 : HEAPU8;
                return this['fromWireType'](heap[pointer]);
            };
            case 1: return function(pointer) {
                var heap = signed ? HEAP16 : HEAPU16;
                return this['fromWireType'](heap[pointer >> 1]);
            };
            case 2: return function(pointer) {
                var heap = signed ? HEAP32 : HEAPU32;
                return this['fromWireType'](heap[pointer >> 2]);
            };
            default:
                throw new TypeError("Unknown integer type: " + name);
        }
      }function __embind_register_enum(
        rawType,
        name,
        size,
        isSigned
      ) {
        var shift = getShiftFromSize(size);
        name = readLatin1String(name);
    
        function ctor() {
        }
        ctor.values = {};
    
        registerType(rawType, {
            name: name,
            constructor: ctor,
            'fromWireType': function(c) {
                return this.constructor.values[c];
            },
            'toWireType': function(destructors, c) {
                return c.value;
            },
            'argPackAdvance': 8,
            'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
            destructorFunction: null,
        });
        exposePublicSymbol(name, ctor);
      }
  
    
    function requireRegisteredType(rawType, humanName) {
        var impl = registeredTypes[rawType];
        if (undefined === impl) {
            throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
        }
        return impl;
      }function __embind_register_enum_value(
        rawEnumType,
        name,
        enumValue
      ) {
        var enumType = requireRegisteredType(rawEnumType, 'enum');
        name = readLatin1String(name);
    
        var Enum = enumType.constructor;
    
        var Value = Object.create(enumType.constructor.prototype, {
            value: {value: enumValue},
            constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
        });
        Enum.values[enumValue] = Value;
        Enum[name] = Value;
      }
  
    
    function _embind_repr(v) {
        if (v === null) {
            return 'null';
        }
        var t = typeof v;
        if (t === 'object' || t === 'array' || t === 'function') {
            return v.toString();
        } else {
            return '' + v;
        }
      }
    
    function floatReadValueFromPointer(name, shift) {
        switch (shift) {
            case 2: return function(pointer) {
                return this['fromWireType'](HEAPF32[pointer >> 2]);
            };
            case 3: return function(pointer) {
                return this['fromWireType'](HEAPF64[pointer >> 3]);
            };
            default:
                throw new TypeError("Unknown float type: " + name);
        }
      }function __embind_register_float(rawType, name, size) {
        var shift = getShiftFromSize(size);
        name = readLatin1String(name);
        registerType(rawType, {
            name: name,
            'fromWireType': function(value) {
                return value;
            },
            'toWireType': function(destructors, value) {
                // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
                // avoid the following if() and assume value is of proper type.
                if (typeof value !== "number" && typeof value !== "boolean") {
                    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                }
                return value;
            },
            'argPackAdvance': 8,
            'readValueFromPointer': floatReadValueFromPointer(name, shift),
            destructorFunction: null, // This type does not need a destructor
        });
      }
  
    
    function integerReadValueFromPointer(name, shift, signed) {
        // integers are quite common, so generate very specialized functions
        switch (shift) {
            case 0: return signed ?
                function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
                function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
            case 1: return signed ?
                function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
                function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
            case 2: return signed ?
                function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
                function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
            default:
                throw new TypeError("Unknown integer type: " + name);
        }
      }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
        name = readLatin1String(name);
        if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
            maxRange = 4294967295;
        }
    
        var shift = getShiftFromSize(size);
    
        var fromWireType = function(value) {
            return value;
        };
    
        if (minRange === 0) {
            var bitshift = 32 - 8*size;
            fromWireType = function(value) {
                return (value << bitshift) >>> bitshift;
            };
        }
    
        var isUnsignedType = (name.indexOf('unsigned') != -1);
    
        registerType(primitiveType, {
            name: name,
            'fromWireType': fromWireType,
            'toWireType': function(destructors, value) {
                // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
                // avoid the following two if()s and assume value is of proper type.
                if (typeof value !== "number" && typeof value !== "boolean") {
                    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
                }
                if (value < minRange || value > maxRange) {
                    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
                }
                return isUnsignedType ? (value >>> 0) : (value | 0);
            },
            'argPackAdvance': 8,
            'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
            destructorFunction: null, // This type does not need a destructor
        });
      }
  
    function __embind_register_memory_view(rawType, dataTypeIndex, name) {
        var typeMapping = [
            Int8Array,
            Uint8Array,
            Int16Array,
            Uint16Array,
            Int32Array,
            Uint32Array,
            Float32Array,
            Float64Array,
        ];
    
        var TA = typeMapping[dataTypeIndex];
    
        function decodeMemoryView(handle) {
            handle = handle >> 2;
            var heap = HEAPU32;
            var size = heap[handle]; // in elements
            var data = heap[handle + 1]; // byte offset into emscripten heap
            return new TA(heap['buffer'], data, size);
        }
    
        name = readLatin1String(name);
        registerType(rawType, {
            name: name,
            'fromWireType': decodeMemoryView,
            'argPackAdvance': 8,
            'readValueFromPointer': decodeMemoryView,
        }, {
            ignoreDuplicateRegistrations: true,
        });
      }
  
    function __embind_register_std_string(rawType, name) {
        name = readLatin1String(name);
        var stdStringIsUTF8
        //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
        = (name === "std::string");
    
        registerType(rawType, {
            name: name,
            'fromWireType': function(value) {
                var length = HEAPU32[value >> 2];
    
                var str;
                if(stdStringIsUTF8) {
                    //ensure null termination at one-past-end byte if not present yet
                    var endChar = HEAPU8[value + 4 + length];
                    var endCharSwap = 0;
                    if(endChar != 0)
                    {
                      endCharSwap = endChar;
                      HEAPU8[value + 4 + length] = 0;
                    }
    
                    var decodeStartPtr = value + 4;
                    //looping here to support possible embedded '0' bytes
                    for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i;
                      if(HEAPU8[currentBytePtr] == 0)
                      {
                        var stringSegment = UTF8ToString(decodeStartPtr);
                        if(str === undefined)
                          str = stringSegment;
                        else
                        {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                        }
                        decodeStartPtr = currentBytePtr + 1;
                      }
                    }
    
                    if(endCharSwap != 0)
                      HEAPU8[value + 4 + length] = endCharSwap;
                } else {
                    var a = new Array(length);
                    for (var i = 0; i < length; ++i) {
                        a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                    }
                    str = a.join('');
                }
    
                _free(value);
                
                return str;
            },
            'toWireType': function(destructors, value) {
                if (value instanceof ArrayBuffer) {
                    value = new Uint8Array(value);
                }
                
                var getLength;
                var valueIsOfTypeString = (typeof value === 'string');
    
                if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                    throwBindingError('Cannot pass non-string to std::string');
                }
                if (stdStringIsUTF8 && valueIsOfTypeString) {
                    getLength = function() {return lengthBytesUTF8(value);};
                } else {
                    getLength = function() {return value.length;};
                }
                
                // assumes 4-byte alignment
                var length = getLength();
                var ptr = _malloc(4 + length + 1);
                HEAPU32[ptr >> 2] = length;
    
                if (stdStringIsUTF8 && valueIsOfTypeString) {
                    stringToUTF8(value, ptr + 4, length + 1);
                } else {
                    if(valueIsOfTypeString) {
                        for (var i = 0; i < length; ++i) {
                            var charCode = value.charCodeAt(i);
                            if (charCode > 255) {
                                _free(ptr);
                                throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                            }
                            HEAPU8[ptr + 4 + i] = charCode;
                        }
                    } else {
                        for (var i = 0; i < length; ++i) {
                            HEAPU8[ptr + 4 + i] = value[i];
                        }
                    }
                }
    
                if (destructors !== null) {
                    destructors.push(_free, ptr);
                }
                return ptr;
            },
            'argPackAdvance': 8,
            'readValueFromPointer': simpleReadValueFromPointer,
            destructorFunction: function(ptr) { _free(ptr); },
        });
      }
  
    function __embind_register_std_wstring(rawType, charSize, name) {
        // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by emscripten_resize_heap().
        name = readLatin1String(name);
        var getHeap, shift;
        if (charSize === 2) {
            getHeap = function() { return HEAPU16; };
            shift = 1;
        } else if (charSize === 4) {
            getHeap = function() { return HEAPU32; };
            shift = 2;
        }
        registerType(rawType, {
            name: name,
            'fromWireType': function(value) {
                var HEAP = getHeap();
                var length = HEAPU32[value >> 2];
                var a = new Array(length);
                var start = (value + 4) >> shift;
                for (var i = 0; i < length; ++i) {
                    a[i] = String.fromCharCode(HEAP[start + i]);
                }
                _free(value);
                return a.join('');
            },
            'toWireType': function(destructors, value) {
                // assumes 4-byte alignment
                var HEAP = getHeap();
                var length = value.length;
                var ptr = _malloc(4 + length * charSize);
                HEAPU32[ptr >> 2] = length;
                var start = (ptr + 4) >> shift;
                for (var i = 0; i < length; ++i) {
                    HEAP[start + i] = value.charCodeAt(i);
                }
                if (destructors !== null) {
                    destructors.push(_free, ptr);
                }
                return ptr;
            },
            'argPackAdvance': 8,
            'readValueFromPointer': simpleReadValueFromPointer,
            destructorFunction: function(ptr) { _free(ptr); },
        });
      }
  
    function __embind_register_value_array(
        rawType,
        name,
        constructorSignature,
        rawConstructor,
        destructorSignature,
        rawDestructor
      ) {
        tupleRegistrations[rawType] = {
            name: readLatin1String(name),
            rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
            rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
            elements: [],
        };
      }
  
    function __embind_register_value_array_element(
        rawTupleType,
        getterReturnType,
        getterSignature,
        getter,
        getterContext,
        setterArgumentType,
        setterSignature,
        setter,
        setterContext
      ) {
        tupleRegistrations[rawTupleType].elements.push({
            getterReturnType: getterReturnType,
            getter: embind__requireFunction(getterSignature, getter),
            getterContext: getterContext,
            setterArgumentType: setterArgumentType,
            setter: embind__requireFunction(setterSignature, setter),
            setterContext: setterContext,
        });
      }
  
    function __embind_register_value_object(
        rawType,
        name,
        constructorSignature,
        rawConstructor,
        destructorSignature,
        rawDestructor
      ) {
        structRegistrations[rawType] = {
            name: readLatin1String(name),
            rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
            rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
            fields: [],
        };
      }
  
    function __embind_register_value_object_field(
        structType,
        fieldName,
        getterReturnType,
        getterSignature,
        getter,
        getterContext,
        setterArgumentType,
        setterSignature,
        setter,
        setterContext
      ) {
        structRegistrations[structType].fields.push({
            fieldName: readLatin1String(fieldName),
            getterReturnType: getterReturnType,
            getter: embind__requireFunction(getterSignature, getter),
            getterContext: getterContext,
            setterArgumentType: setterArgumentType,
            setter: embind__requireFunction(setterSignature, setter),
            setterContext: setterContext,
        });
      }
  
    function __embind_register_void(rawType, name) {
        name = readLatin1String(name);
        registerType(rawType, {
            isVoid: true, // void return values can be optimized out sometimes
            name: name,
            'argPackAdvance': 0,
            'fromWireType': function() {
                return undefined;
            },
            'toWireType': function(destructors, o) {
                // TODO: assert if anything else is given?
                return undefined;
            },
        });
      }
  
    
    function requireHandle(handle) {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        return emval_handle_array[handle].value;
      }function __emval_as(handle, returnType, destructorsRef) {
        handle = requireHandle(handle);
        returnType = requireRegisteredType(returnType, 'emval::as');
        var destructors = [];
        var rd = __emval_register(destructors);
        HEAP32[destructorsRef >> 2] = rd;
        return returnType['toWireType'](destructors, handle);
      }
  
    
    function __emval_allocateDestructors(destructorsRef) {
        var destructors = [];
        HEAP32[destructorsRef >> 2] = __emval_register(destructors);
        return destructors;
      }
    
    
    var emval_symbols={};function getStringOrSymbol(address) {
        var symbol = emval_symbols[address];
        if (symbol === undefined) {
            return readLatin1String(address);
        } else {
            return symbol;
        }
      }
    
    var emval_methodCallers=[];function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
        caller = emval_methodCallers[caller];
        handle = requireHandle(handle);
        methodName = getStringOrSymbol(methodName);
        return caller(handle, methodName, __emval_allocateDestructors(destructorsRef), args);
      }
  
    function __emval_call_void_method(caller, handle, methodName, args) {
        caller = emval_methodCallers[caller];
        handle = requireHandle(handle);
        methodName = getStringOrSymbol(methodName);
        caller(handle, methodName, null, args);
      }
  
  
    
    function emval_get_global() { return (function(){return Function;})()('return this')(); }function __emval_get_global(name) {
        if(name===0){
          return __emval_register(emval_get_global());
        } else {
          name = getStringOrSymbol(name);
          return __emval_register(emval_get_global()[name]);
        }
      }
  
    
    function __emval_addMethodCaller(caller) {
        var id = emval_methodCallers.length;
        emval_methodCallers.push(caller);
        return id;
      }
    
    function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
        var a = new Array(argCount);
        for (var i = 0; i < argCount; ++i) {
            a[i] = requireRegisteredType(
                HEAP32[(argTypes >> 2) + i],
                "parameter " + i);
        }
        return a;
      }function __emval_get_method_caller(argCount, argTypes) {
        var types = __emval_lookupTypes(argCount, argTypes);
    
        var retType = types[0];
        var signatureName = retType.name + "_$" + types.slice(1).map(function (t) { return t.name; }).join("_") + "$";
    
        var params = ["retType"];
        var args = [retType];
    
        var argsList = ""; // 'arg0, arg1, arg2, ... , argN'
        for (var i = 0; i < argCount - 1; ++i) {
            argsList += (i !== 0 ? ", " : "") + "arg" + i;
            params.push("argType" + i);
            args.push(types[1 + i]);
        }
    
        var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
        var functionBody =
            "return function " + functionName + "(handle, name, destructors, args) {\n";
    
        var offset = 0;
        for (var i = 0; i < argCount - 1; ++i) {
            functionBody +=
            "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? ("+"+offset) : "") + ");\n";
            offset += types[i + 1]['argPackAdvance'];
        }
        functionBody +=
            "    var rv = handle[name](" + argsList + ");\n";
        for (var i = 0; i < argCount - 1; ++i) {
            if (types[i + 1]['deleteObject']) {
                functionBody +=
                "    argType" + i + ".deleteObject(arg" + i + ");\n";
            }
        }
        if (!retType.isVoid) {
            functionBody +=
            "    return retType.toWireType(destructors, rv);\n";
        }
        functionBody +=
            "};\n";
    
        params.push(functionBody);
        var invokerFunction = new_(Function, params).apply(null, args);
        return __emval_addMethodCaller(invokerFunction);
      }
  
    function __emval_get_module_property(name) {
        name = getStringOrSymbol(name);
        return __emval_register(Module[name]);
      }
  
    function __emval_get_property(handle, key) {
        handle = requireHandle(handle);
        key = requireHandle(key);
        return __emval_register(handle[key]);
      }
  
    function __emval_incref(handle) {
        if (handle > 4) {
            emval_handle_array[handle].refcount += 1;
        }
      }
  
    function __emval_instanceof(object, constructor) {
        object = requireHandle(object);
        constructor = requireHandle(constructor);
        return object instanceof constructor;
      }
  
    function __emval_new_array() {
        return __emval_register([]);
      }
  
    function __emval_new_cstring(v) {
        return __emval_register(getStringOrSymbol(v));
      }
  
    function __emval_new_object() {
        return __emval_register({});
      }
  
    function __emval_run_destructors(handle) {
        var destructors = emval_handle_array[handle].value;
        runDestructors(destructors);
        __emval_decref(handle);
      }
  
    function __emval_set_property(handle, key, value) {
        handle = requireHandle(handle);
        key = requireHandle(key);
        value = requireHandle(value);
        handle[key] = value;
      }
  
    function __emval_take_value(type, argv) {
        type = requireRegisteredType(type, '_emval_take_value');
        var v = type['readValueFromPointer'](argv);
        return __emval_register(v);
      }
  
    function __emval_typeof(handle) {
        handle = requireHandle(handle);
        return __emval_register(typeof handle);
      }
  
    function _abort() {
        Module['abort']();
      }
  
    function _clock() {
        if (_clock.start === undefined) _clock.start = Date.now();
        return ((Date.now() - _clock.start) * (1000000 / 1000))|0;
      }
  
    function _emscripten_get_heap_size() {
        return HEAP8.length;
      }
  
    
    function abortOnCannotGrowMemory(requestedSize) {
        abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
      }
    
    function emscripten_realloc_buffer(size) {
        var PAGE_MULTIPLE = 65536;
        size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
        var oldSize = buffer.byteLength;
        // native wasm support
        try {
          var result = wasmMemory.grow((size - oldSize) / 65536); // .grow() takes a delta compared to the previous size
          if (result !== (-1 | 0)) {
            // success in native wasm memory growth, get the buffer from the memory
            return buffer = wasmMemory.buffer;
          } else {
            return null;
          }
        } catch(e) {
          console.error('emscripten_realloc_buffer: Attempted to grow from ' + oldSize  + ' bytes to ' + size + ' bytes, but got error: ' + e);
          return null;
        }
      }function _emscripten_resize_heap(requestedSize) {
        var oldSize = _emscripten_get_heap_size();
        assert(requestedSize > oldSize); // This function should only ever be called after the ceiling of the dynamic heap has already been bumped to exceed the current total size of the asm.js heap.
    
    
        var PAGE_MULTIPLE = 65536;
        var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.
    
        if (requestedSize > LIMIT) {
          err('Cannot enlarge memory, asked to go up to ' + requestedSize + ' bytes, but the limit is ' + LIMIT + ' bytes!');
          return false;
        }
    
        var MIN_TOTAL_MEMORY = 16777216;
        var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.
    
        while (newSize < requestedSize) { // Keep incrementing the heap size as long as it's less than what is requested.
          if (newSize <= 536870912) {
            newSize = alignUp(2 * newSize, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
          } else {
            // ..., but after that, add smaller increments towards 2GB, which we cannot reach
            newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
            if (newSize === oldSize) {
              warnOnce('Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only ' + HEAP8.length);
            }
          }
        }
    
    
        var start = Date.now();
    
        var replacement = emscripten_realloc_buffer(newSize);
        if (!replacement || replacement.byteLength != newSize) {
          err('Failed to grow the heap from ' + oldSize + ' bytes to ' + newSize + ' bytes, not enough memory!');
          if (replacement) {
            err('Expected to get back a buffer of size ' + newSize + ' bytes, but instead got back a buffer of size ' + replacement.byteLength);
          }
          return false;
        }
    
        // everything worked
        updateGlobalBufferViews();
    
    
    
        return true;
      }
  
    
    var ___tm_current=287008;
    
    
    var ___tm_timezone=(stringToUTF8("GMT", 287056, 4), 287056);function _gmtime_r(time, tmPtr) {
        var date = new Date(HEAP32[((time)>>2)]*1000);
        HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
        HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
        HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
        HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
        HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
        HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
        HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
        HEAP32[(((tmPtr)+(36))>>2)]=0;
        HEAP32[(((tmPtr)+(32))>>2)]=0;
        var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
        var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
        HEAP32[(((tmPtr)+(28))>>2)]=yday;
        HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
    
        return tmPtr;
      }function _gmtime(time) {
        return _gmtime_r(time, ___tm_current);
      }
  
     
  
    var _llvm_cos_f64=Math_cos;
  
    
    function _llvm_log2_f32(x) {
        return Math.log(x) / Math.LN2; // TODO: Math.log2, when browser support is there
      }function _llvm_log2_f64(a0
    /*``*/) {
    return _llvm_log2_f32(a0);
    }
  
    var _llvm_sin_f64=Math_sin;
  
    function _llvm_trap() {
        abort('trap!');
      }
  
    
    function _emscripten_memcpy_big(dest, src, num) {
        HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      }
    
     
  
     
  
     
  
     
  
    function _time(ptr) {
        var ret = (Date.now()/1000)|0;
        if (ptr) {
          HEAP32[((ptr)>>2)]=ret;
        }
        return ret;
      }
  
    function _uuid_generate(out) {
        // void uuid_generate(uuid_t out);
        var uuid = null;
    
        if (ENVIRONMENT_IS_NODE) {
          // If Node.js try to use crypto.randomBytes
          try {
            var rb = require('crypto')['randomBytes'];
            uuid = rb(16);
          } catch(e) {}
        } else if (ENVIRONMENT_IS_WEB &&
                   typeof(window.crypto) !== 'undefined' &&
                   typeof(window.crypto.getRandomValues) !== 'undefined') {
          // If crypto.getRandomValues is available try to use it.
          uuid = new Uint8Array(16);
          window.crypto.getRandomValues(uuid);
        }
    
        // Fall back to Math.random if a higher quality random number generator is not available.
        if (!uuid) {
          uuid = new Array(16);
          var d = new Date().getTime();
          for (var i = 0; i < 16; i++) {
            var r = ((d + Math.random() * 256) % 256)|0;
            d = (d / 256)|0;
            uuid[i] = r;
          }
        }
    
        uuid[6] = (uuid[6] & 0x0F) | 0x40;
        uuid[8] = (uuid[8] & 0x7F) | 0x80;
        writeArrayToMemory(uuid, out);
      }
  FS.staticInit();;
  if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
  InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
  embind_init_charCodes();
  BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
  init_ClassHandle();
  init_RegisteredPointer();
  init_embind();;
  UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
  init_emval();;
  var ASSERTIONS = true;
  
  // Copyright 2017 The Emscripten Authors.  All rights reserved.
  // Emscripten is available under two separate licenses, the MIT license and the
  // University of Illinois/NCSA Open Source License.  Both these licenses can be
  // found in the LICENSE file.
  
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  
  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 0xFF) {
        if (ASSERTIONS) {
          assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
        }
        chr &= 0xFF;
      }
      ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }
  
  
  // ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array
  
  
  function nullFunc_di(x) { err("Invalid function pointer called with signature 'di'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_dii(x) { err("Invalid function pointer called with signature 'dii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_diii(x) { err("Invalid function pointer called with signature 'diii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_fii(x) { err("Invalid function pointer called with signature 'fii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_i(x) { err("Invalid function pointer called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_ii(x) { err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iid(x) { err("Invalid function pointer called with signature 'iid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidd(x) { err("Invalid function pointer called with signature 'iidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiddd(x) { err("Invalid function pointer called with signature 'iiddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidddddd(x) { err("Invalid function pointer called with signature 'iidddddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiddi(x) { err("Invalid function pointer called with signature 'iiddi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiddii(x) { err("Invalid function pointer called with signature 'iiddii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiddiiiii(x) { err("Invalid function pointer called with signature 'iiddiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidi(x) { err("Invalid function pointer called with signature 'iidi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidid(x) { err("Invalid function pointer called with signature 'iidid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iididii(x) { err("Invalid function pointer called with signature 'iididii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidii(x) { err("Invalid function pointer called with signature 'iidii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidiii(x) { err("Invalid function pointer called with signature 'iidiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iidiiiii(x) { err("Invalid function pointer called with signature 'iidiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iii(x) { err("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiid(x) { err("Invalid function pointer called with signature 'iiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidd(x) { err("Invalid function pointer called with signature 'iiidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiddd(x) { err("Invalid function pointer called with signature 'iiiddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidddddd(x) { err("Invalid function pointer called with signature 'iiidddddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiddi(x) { err("Invalid function pointer called with signature 'iiiddi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiddiddddd(x) { err("Invalid function pointer called with signature 'iiiddiddddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiddiiidd(x) { err("Invalid function pointer called with signature 'iiiddiiidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidi(x) { err("Invalid function pointer called with signature 'iiidi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidid(x) { err("Invalid function pointer called with signature 'iiidid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiididdddd(x) { err("Invalid function pointer called with signature 'iiididdddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidii(x) { err("Invalid function pointer called with signature 'iiidii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiidiii(x) { err("Invalid function pointer called with signature 'iiidiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiii(x) { err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiid(x) { err("Invalid function pointer called with signature 'iiiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiidd(x) { err("Invalid function pointer called with signature 'iiiidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiiddiiidd(x) { err("Invalid function pointer called with signature 'iiiiddiiidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiidi(x) { err("Invalid function pointer called with signature 'iiiidi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiidiii(x) { err("Invalid function pointer called with signature 'iiiidiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiii(x) { err("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiiii(x) { err("Invalid function pointer called with signature 'iiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_iiiiiiii(x) { err("Invalid function pointer called with signature 'iiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_ji(x) { err("Invalid function pointer called with signature 'ji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_v(x) { err("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_vi(x) { err("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_vid(x) { err("Invalid function pointer called with signature 'vid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viddd(x) { err("Invalid function pointer called with signature 'viddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_vidii(x) { err("Invalid function pointer called with signature 'vidii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_vii(x) { err("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viid(x) { err("Invalid function pointer called with signature 'viid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viidd(x) { err("Invalid function pointer called with signature 'viidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viiddd(x) { err("Invalid function pointer called with signature 'viiddd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viif(x) { err("Invalid function pointer called with signature 'viif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viii(x) { err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viiid(x) { err("Invalid function pointer called with signature 'viiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viiii(x) { err("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viiiii(x) { err("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  function nullFunc_viiiiii(x) { err("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }
  
  var asmGlobalArg = {}
  
  var asmLibraryArg = {
    "abort": abort,
    "setTempRet0": setTempRet0,
    "getTempRet0": getTempRet0,
    "abortStackOverflow": abortStackOverflow,
    "nullFunc_di": nullFunc_di,
    "nullFunc_dii": nullFunc_dii,
    "nullFunc_diii": nullFunc_diii,
    "nullFunc_fii": nullFunc_fii,
    "nullFunc_i": nullFunc_i,
    "nullFunc_ii": nullFunc_ii,
    "nullFunc_iid": nullFunc_iid,
    "nullFunc_iidd": nullFunc_iidd,
    "nullFunc_iiddd": nullFunc_iiddd,
    "nullFunc_iidddddd": nullFunc_iidddddd,
    "nullFunc_iiddi": nullFunc_iiddi,
    "nullFunc_iiddii": nullFunc_iiddii,
    "nullFunc_iiddiiiii": nullFunc_iiddiiiii,
    "nullFunc_iidi": nullFunc_iidi,
    "nullFunc_iidid": nullFunc_iidid,
    "nullFunc_iididii": nullFunc_iididii,
    "nullFunc_iidii": nullFunc_iidii,
    "nullFunc_iidiii": nullFunc_iidiii,
    "nullFunc_iidiiiii": nullFunc_iidiiiii,
    "nullFunc_iii": nullFunc_iii,
    "nullFunc_iiid": nullFunc_iiid,
    "nullFunc_iiidd": nullFunc_iiidd,
    "nullFunc_iiiddd": nullFunc_iiiddd,
    "nullFunc_iiidddddd": nullFunc_iiidddddd,
    "nullFunc_iiiddi": nullFunc_iiiddi,
    "nullFunc_iiiddiddddd": nullFunc_iiiddiddddd,
    "nullFunc_iiiddiiidd": nullFunc_iiiddiiidd,
    "nullFunc_iiidi": nullFunc_iiidi,
    "nullFunc_iiidid": nullFunc_iiidid,
    "nullFunc_iiididdddd": nullFunc_iiididdddd,
    "nullFunc_iiidii": nullFunc_iiidii,
    "nullFunc_iiidiii": nullFunc_iiidiii,
    "nullFunc_iiii": nullFunc_iiii,
    "nullFunc_iiiid": nullFunc_iiiid,
    "nullFunc_iiiidd": nullFunc_iiiidd,
    "nullFunc_iiiiddiiidd": nullFunc_iiiiddiiidd,
    "nullFunc_iiiidi": nullFunc_iiiidi,
    "nullFunc_iiiidiii": nullFunc_iiiidiii,
    "nullFunc_iiiii": nullFunc_iiiii,
    "nullFunc_iiiiii": nullFunc_iiiiii,
    "nullFunc_iiiiiii": nullFunc_iiiiiii,
    "nullFunc_iiiiiiii": nullFunc_iiiiiiii,
    "nullFunc_ji": nullFunc_ji,
    "nullFunc_v": nullFunc_v,
    "nullFunc_vi": nullFunc_vi,
    "nullFunc_vid": nullFunc_vid,
    "nullFunc_viddd": nullFunc_viddd,
    "nullFunc_vidii": nullFunc_vidii,
    "nullFunc_vii": nullFunc_vii,
    "nullFunc_viid": nullFunc_viid,
    "nullFunc_viidd": nullFunc_viidd,
    "nullFunc_viiddd": nullFunc_viiddd,
    "nullFunc_viif": nullFunc_viif,
    "nullFunc_viii": nullFunc_viii,
    "nullFunc_viiid": nullFunc_viiid,
    "nullFunc_viiii": nullFunc_viiii,
    "nullFunc_viiiii": nullFunc_viiiii,
    "nullFunc_viiiiii": nullFunc_viiiiii,
    "ClassHandle": ClassHandle,
    "ClassHandle_clone": ClassHandle_clone,
    "ClassHandle_delete": ClassHandle_delete,
    "ClassHandle_deleteLater": ClassHandle_deleteLater,
    "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
    "ClassHandle_isDeleted": ClassHandle_isDeleted,
    "RegisteredClass": RegisteredClass,
    "RegisteredPointer": RegisteredPointer,
    "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
    "RegisteredPointer_destructor": RegisteredPointer_destructor,
    "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
    "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
    "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
    "___cxa_allocate_exception": ___cxa_allocate_exception,
    "___cxa_begin_catch": ___cxa_begin_catch,
    "___cxa_find_matching_catch": ___cxa_find_matching_catch,
    "___cxa_free_exception": ___cxa_free_exception,
    "___cxa_pure_virtual": ___cxa_pure_virtual,
    "___cxa_throw": ___cxa_throw,
    "___gxx_personality_v0": ___gxx_personality_v0,
    "___lock": ___lock,
    "___resumeException": ___resumeException,
    "___setErrNo": ___setErrNo,
    "___syscall140": ___syscall140,
    "___syscall145": ___syscall145,
    "___syscall146": ___syscall146,
    "___syscall195": ___syscall195,
    "___syscall197": ___syscall197,
    "___syscall221": ___syscall221,
    "___syscall5": ___syscall5,
    "___syscall54": ___syscall54,
    "___syscall6": ___syscall6,
    "___unlock": ___unlock,
    "__embind_finalize_value_array": __embind_finalize_value_array,
    "__embind_finalize_value_object": __embind_finalize_value_object,
    "__embind_register_bool": __embind_register_bool,
    "__embind_register_class": __embind_register_class,
    "__embind_register_class_class_function": __embind_register_class_class_function,
    "__embind_register_class_constructor": __embind_register_class_constructor,
    "__embind_register_class_function": __embind_register_class_function,
    "__embind_register_class_property": __embind_register_class_property,
    "__embind_register_emval": __embind_register_emval,
    "__embind_register_enum": __embind_register_enum,
    "__embind_register_enum_value": __embind_register_enum_value,
    "__embind_register_float": __embind_register_float,
    "__embind_register_integer": __embind_register_integer,
    "__embind_register_memory_view": __embind_register_memory_view,
    "__embind_register_std_string": __embind_register_std_string,
    "__embind_register_std_wstring": __embind_register_std_wstring,
    "__embind_register_value_array": __embind_register_value_array,
    "__embind_register_value_array_element": __embind_register_value_array_element,
    "__embind_register_value_object": __embind_register_value_object,
    "__embind_register_value_object_field": __embind_register_value_object_field,
    "__embind_register_void": __embind_register_void,
    "__emval_addMethodCaller": __emval_addMethodCaller,
    "__emval_allocateDestructors": __emval_allocateDestructors,
    "__emval_as": __emval_as,
    "__emval_call_method": __emval_call_method,
    "__emval_call_void_method": __emval_call_void_method,
    "__emval_decref": __emval_decref,
    "__emval_get_global": __emval_get_global,
    "__emval_get_method_caller": __emval_get_method_caller,
    "__emval_get_module_property": __emval_get_module_property,
    "__emval_get_property": __emval_get_property,
    "__emval_incref": __emval_incref,
    "__emval_instanceof": __emval_instanceof,
    "__emval_lookupTypes": __emval_lookupTypes,
    "__emval_new_array": __emval_new_array,
    "__emval_new_cstring": __emval_new_cstring,
    "__emval_new_object": __emval_new_object,
    "__emval_register": __emval_register,
    "__emval_run_destructors": __emval_run_destructors,
    "__emval_set_property": __emval_set_property,
    "__emval_take_value": __emval_take_value,
    "__emval_typeof": __emval_typeof,
    "_abort": _abort,
    "_clock": _clock,
    "_embind_repr": _embind_repr,
    "_emscripten_get_heap_size": _emscripten_get_heap_size,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "_emscripten_resize_heap": _emscripten_resize_heap,
    "_gmtime": _gmtime,
    "_gmtime_r": _gmtime_r,
    "_llvm_cos_f64": _llvm_cos_f64,
    "_llvm_log2_f32": _llvm_log2_f32,
    "_llvm_log2_f64": _llvm_log2_f64,
    "_llvm_sin_f64": _llvm_sin_f64,
    "_llvm_trap": _llvm_trap,
    "_time": _time,
    "_uuid_generate": _uuid_generate,
    "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
    "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
    "count_emval_handles": count_emval_handles,
    "craftInvokerFunction": craftInvokerFunction,
    "createNamedFunction": createNamedFunction,
    "downcastPointer": downcastPointer,
    "embind__requireFunction": embind__requireFunction,
    "embind_init_charCodes": embind_init_charCodes,
    "emscripten_realloc_buffer": emscripten_realloc_buffer,
    "emval_get_global": emval_get_global,
    "ensureOverloadTable": ensureOverloadTable,
    "enumReadValueFromPointer": enumReadValueFromPointer,
    "exposePublicSymbol": exposePublicSymbol,
    "extendError": extendError,
    "floatReadValueFromPointer": floatReadValueFromPointer,
    "flushPendingDeletes": flushPendingDeletes,
    "genericPointerToWireType": genericPointerToWireType,
    "getBasestPointer": getBasestPointer,
    "getInheritedInstance": getInheritedInstance,
    "getInheritedInstanceCount": getInheritedInstanceCount,
    "getLiveInheritedInstances": getLiveInheritedInstances,
    "getShiftFromSize": getShiftFromSize,
    "getStringOrSymbol": getStringOrSymbol,
    "getTypeName": getTypeName,
    "get_first_emval": get_first_emval,
    "heap32VectorToArray": heap32VectorToArray,
    "init_ClassHandle": init_ClassHandle,
    "init_RegisteredPointer": init_RegisteredPointer,
    "init_embind": init_embind,
    "init_emval": init_emval,
    "integerReadValueFromPointer": integerReadValueFromPointer,
    "makeClassHandle": makeClassHandle,
    "makeLegalFunctionName": makeLegalFunctionName,
    "new_": new_,
    "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
    "readLatin1String": readLatin1String,
    "registerType": registerType,
    "replacePublicSymbol": replacePublicSymbol,
    "requireHandle": requireHandle,
    "requireRegisteredType": requireRegisteredType,
    "runDestructor": runDestructor,
    "runDestructors": runDestructors,
    "setDelayFunction": setDelayFunction,
    "shallowCopyInternalPointer": shallowCopyInternalPointer,
    "simpleReadValueFromPointer": simpleReadValueFromPointer,
    "throwBindingError": throwBindingError,
    "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
    "throwInternalError": throwInternalError,
    "throwUnboundTypeError": throwUnboundTypeError,
    "upcastPointer": upcastPointer,
    "validateThis": validateThis,
    "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
    "tempDoublePtr": tempDoublePtr,
    "DYNAMICTOP_PTR": DYNAMICTOP_PTR
  }
  // EMSCRIPTEN_START_ASM
  var asm =Module["asm"]// EMSCRIPTEN_END_ASM
  (asmGlobalArg, asmLibraryArg, buffer);
  
  var real____cxa_can_catch = asm["___cxa_can_catch"]; asm["___cxa_can_catch"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____cxa_can_catch.apply(null, arguments);
  };
  
  var real____cxa_is_pointer_type = asm["___cxa_is_pointer_type"]; asm["___cxa_is_pointer_type"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____cxa_is_pointer_type.apply(null, arguments);
  };
  
  var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____errno_location.apply(null, arguments);
  };
  
  var real____getTypeName = asm["___getTypeName"]; asm["___getTypeName"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____getTypeName.apply(null, arguments);
  };
  
  var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__fflush.apply(null, arguments);
  };
  
  var real__free = asm["_free"]; asm["_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__free.apply(null, arguments);
  };
  
  var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"]; asm["_llvm_bswap_i32"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__llvm_bswap_i32.apply(null, arguments);
  };
  
  var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__malloc.apply(null, arguments);
  };
  
  var real__memmove = asm["_memmove"]; asm["_memmove"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__memmove.apply(null, arguments);
  };
  
  var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__sbrk.apply(null, arguments);
  };
  
  var real_establishStackSpace = asm["establishStackSpace"]; asm["establishStackSpace"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_establishStackSpace.apply(null, arguments);
  };
  
  var real_globalCtors = asm["globalCtors"]; asm["globalCtors"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_globalCtors.apply(null, arguments);
  };
  
  var real_stackAlloc = asm["stackAlloc"]; asm["stackAlloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackAlloc.apply(null, arguments);
  };
  
  var real_stackRestore = asm["stackRestore"]; asm["stackRestore"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackRestore.apply(null, arguments);
  };
  
  var real_stackSave = asm["stackSave"]; asm["stackSave"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackSave.apply(null, arguments);
  };
  Module["asm"] = asm;
  var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___cxa_can_catch"].apply(null, arguments) };
  var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments) };
  var ___errno_location = Module["___errno_location"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___errno_location"].apply(null, arguments) };
  var ___getTypeName = Module["___getTypeName"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___getTypeName"].apply(null, arguments) };
  var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments) };
  var _fflush = Module["_fflush"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_fflush"].apply(null, arguments) };
  var _free = Module["_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_free"].apply(null, arguments) };
  var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
  var _malloc = Module["_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_malloc"].apply(null, arguments) };
  var _memcpy = Module["_memcpy"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_memcpy"].apply(null, arguments) };
  var _memmove = Module["_memmove"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_memmove"].apply(null, arguments) };
  var _memset = Module["_memset"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_memset"].apply(null, arguments) };
  var _sbrk = Module["_sbrk"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_sbrk"].apply(null, arguments) };
  var establishStackSpace = Module["establishStackSpace"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["establishStackSpace"].apply(null, arguments) };
  var globalCtors = Module["globalCtors"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["globalCtors"].apply(null, arguments) };
  var stackAlloc = Module["stackAlloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackAlloc"].apply(null, arguments) };
  var stackRestore = Module["stackRestore"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackRestore"].apply(null, arguments) };
  var stackSave = Module["stackSave"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackSave"].apply(null, arguments) };
  var dynCall_di = Module["dynCall_di"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_di"].apply(null, arguments) };
  var dynCall_dii = Module["dynCall_dii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_dii"].apply(null, arguments) };
  var dynCall_diii = Module["dynCall_diii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_diii"].apply(null, arguments) };
  var dynCall_fii = Module["dynCall_fii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_fii"].apply(null, arguments) };
  var dynCall_i = Module["dynCall_i"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_i"].apply(null, arguments) };
  var dynCall_ii = Module["dynCall_ii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_ii"].apply(null, arguments) };
  var dynCall_iid = Module["dynCall_iid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iid"].apply(null, arguments) };
  var dynCall_iidd = Module["dynCall_iidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidd"].apply(null, arguments) };
  var dynCall_iiddd = Module["dynCall_iiddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiddd"].apply(null, arguments) };
  var dynCall_iidddddd = Module["dynCall_iidddddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidddddd"].apply(null, arguments) };
  var dynCall_iiddi = Module["dynCall_iiddi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiddi"].apply(null, arguments) };
  var dynCall_iiddii = Module["dynCall_iiddii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiddii"].apply(null, arguments) };
  var dynCall_iiddiiiii = Module["dynCall_iiddiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiddiiiii"].apply(null, arguments) };
  var dynCall_iidi = Module["dynCall_iidi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidi"].apply(null, arguments) };
  var dynCall_iidid = Module["dynCall_iidid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidid"].apply(null, arguments) };
  var dynCall_iididii = Module["dynCall_iididii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iididii"].apply(null, arguments) };
  var dynCall_iidii = Module["dynCall_iidii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidii"].apply(null, arguments) };
  var dynCall_iidiii = Module["dynCall_iidiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidiii"].apply(null, arguments) };
  var dynCall_iidiiiii = Module["dynCall_iidiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidiiiii"].apply(null, arguments) };
  var dynCall_iii = Module["dynCall_iii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iii"].apply(null, arguments) };
  var dynCall_iiid = Module["dynCall_iiid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiid"].apply(null, arguments) };
  var dynCall_iiidd = Module["dynCall_iiidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidd"].apply(null, arguments) };
  var dynCall_iiiddd = Module["dynCall_iiiddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiddd"].apply(null, arguments) };
  var dynCall_iiidddddd = Module["dynCall_iiidddddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidddddd"].apply(null, arguments) };
  var dynCall_iiiddi = Module["dynCall_iiiddi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiddi"].apply(null, arguments) };
  var dynCall_iiiddiddddd = Module["dynCall_iiiddiddddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiddiddddd"].apply(null, arguments) };
  var dynCall_iiiddiiidd = Module["dynCall_iiiddiiidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiddiiidd"].apply(null, arguments) };
  var dynCall_iiidi = Module["dynCall_iiidi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidi"].apply(null, arguments) };
  var dynCall_iiidid = Module["dynCall_iiidid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidid"].apply(null, arguments) };
  var dynCall_iiididdddd = Module["dynCall_iiididdddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiididdddd"].apply(null, arguments) };
  var dynCall_iiidii = Module["dynCall_iiidii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidii"].apply(null, arguments) };
  var dynCall_iiidiii = Module["dynCall_iiidiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiidiii"].apply(null, arguments) };
  var dynCall_iiii = Module["dynCall_iiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
  var dynCall_iiiid = Module["dynCall_iiiid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiid"].apply(null, arguments) };
  var dynCall_iiiidd = Module["dynCall_iiiidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiidd"].apply(null, arguments) };
  var dynCall_iiiiddiiidd = Module["dynCall_iiiiddiiidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiiddiiidd"].apply(null, arguments) };
  var dynCall_iiiidi = Module["dynCall_iiiidi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiidi"].apply(null, arguments) };
  var dynCall_iiiidiii = Module["dynCall_iiiidiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiidiii"].apply(null, arguments) };
  var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiii"].apply(null, arguments) };
  var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiiii"].apply(null, arguments) };
  var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments) };
  var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments) };
  var dynCall_ji = Module["dynCall_ji"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_ji"].apply(null, arguments) };
  var dynCall_v = Module["dynCall_v"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_v"].apply(null, arguments) };
  var dynCall_vi = Module["dynCall_vi"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vi"].apply(null, arguments) };
  var dynCall_vid = Module["dynCall_vid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vid"].apply(null, arguments) };
  var dynCall_viddd = Module["dynCall_viddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viddd"].apply(null, arguments) };
  var dynCall_vidii = Module["dynCall_vidii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vidii"].apply(null, arguments) };
  var dynCall_vii = Module["dynCall_vii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vii"].apply(null, arguments) };
  var dynCall_viid = Module["dynCall_viid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viid"].apply(null, arguments) };
  var dynCall_viidd = Module["dynCall_viidd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viidd"].apply(null, arguments) };
  var dynCall_viiddd = Module["dynCall_viiddd"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viiddd"].apply(null, arguments) };
  var dynCall_viif = Module["dynCall_viif"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viif"].apply(null, arguments) };
  var dynCall_viii = Module["dynCall_viii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viii"].apply(null, arguments) };
  var dynCall_viiid = Module["dynCall_viiid"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viiid"].apply(null, arguments) };
  var dynCall_viiii = Module["dynCall_viiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viiii"].apply(null, arguments) };
  var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viiiii"].apply(null, arguments) };
  var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_viiiiii"].apply(null, arguments) };
  ;
  
  
  
  // === Auto-generated postamble setup entry stuff ===
  
  Module['asm'] = asm;
  
  if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["intArrayToString"]) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["ccall"]) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["cwrap"]) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["setValue"]) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getValue"]) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["allocate"]) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getMemory"]) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["AsciiToString"]) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stringToAscii"]) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stackTrace"]) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addOnInit"]) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addOnExit"]) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addRunDependency"]) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["ENV"]) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["FS"]) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createPath"]) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createLink"]) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["FS_unlink"]) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
  if (!Module["GL"]) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["warnOnce"]) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getLEB"]) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["registerFunctions"]) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["addFunction"]) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["removeFunction"]) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["prettyPrint"]) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["makeBigInt"]) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["dynCall"]) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stackSave"]) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stackRestore"]) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["stackAlloc"]) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["print"]) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["printErr"]) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["getTempRet0"]) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["setTempRet0"]) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() { abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["writeStackCookie"]) Module["writeStackCookie"] = function() { abort("'writeStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["checkStackCookie"]) Module["checkStackCookie"] = function() { abort("'checkStackCookie' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
  if (!Module["abortStackOverflow"]) Module["abortStackOverflow"] = function() { abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", { get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
  if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", { get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
  if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", { get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
  if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", { get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
  
  
  
  // Modularize mode returns a function, which can be called to
  // create instances. The instances provide a then() method,
  // must like a Promise, that receives a callback. The callback
  // is called when the module is ready to run, with the module
  // as a parameter. (Like a Promise, it also returns the module
  // so you can use the output of .then(..)).
  Module['then'] = function(func) {
    // We may already be ready to run code at this time. if
    // so, just queue a call to the callback.
    if (Module['calledRun']) {
      func(Module);
    } else {
      // we are not ready to call then() yet. we must call it
      // at the same time we would call onRuntimeInitialized.
      var old = Module['onRuntimeInitialized'];
      Module['onRuntimeInitialized'] = function() {
        if (old) old();
        func(Module);
      };
    }
    return Module;
  };
  
  /**
   * @constructor
   * @extends {Error}
   * @this {ExitStatus}
   */
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
  };
  ExitStatus.prototype = new Error();
  ExitStatus.prototype.constructor = ExitStatus;
  
  var calledMain = false;
  
  dependenciesFulfilled = function runCaller() {
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!Module['calledRun']) run();
    if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
  }
  
  
  
  
  
  /** @type {function(Array=)} */
  function run(args) {
    args = args || Module['arguments'];
  
    if (runDependencies > 0) {
      return;
    }
  
    writeStackCookie();
  
    preRun();
  
    if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
    if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame
  
    function doRun() {
      if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
      Module['calledRun'] = true;
  
      if (ABORT) return;
  
      ensureInitRuntime();
  
      preMain();
  
      if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
  
      assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
  
      postRun();
    }
  
    if (Module['setStatus']) {
      Module['setStatus']('Running...');
      setTimeout(function() {
        setTimeout(function() {
          Module['setStatus']('');
        }, 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
    checkStackCookie();
  }
  Module['run'] = run;
  
  function checkUnflushedContent() {
    // Compiler settings do not allow exiting the runtime, so flushing
    // the streams is not possible. but in ASSERTIONS mode we check
    // if there was something to flush, and if so tell the user they
    // should request that the runtime be exitable.
    // Normally we would not even include flush() at all, but in ASSERTIONS
    // builds we do so just for this check, and here we see if there is any
    // content to flush, that is, we check if there would have been
    // something a non-ASSERTIONS build would have not seen.
    // How we flush the streams depends on whether we are in FILESYSTEM=0
    // mode (which has its own special function for this; otherwise, all
    // the code is inside libc)
    var print = out;
    var printErr = err;
    var has = false;
    out = err = function(x) {
      has = true;
    }
    try { // it doesn't matter if it fails
      var flush = Module['_fflush'];
      if (flush) flush(0);
      // also flush in the JS FS layer
      var hasFS = true;
      if (hasFS) {
        ['stdout', 'stderr'].forEach(function(name) {
          var info = FS.analyzePath('/dev/' + name);
          if (!info) return;
          var stream = info.object;
          var rdev = stream.rdev;
          var tty = TTY.ttys[rdev];
          if (tty && tty.output && tty.output.length) {
            has = true;
          }
        });
      }
    } catch(e) {}
    out = print;
    err = printErr;
    if (has) {
      warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    }
  }
  
  function exit(status, implicit) {
    checkUnflushedContent();
  
    // if this is just main exit-ing implicitly, and the status is 0, then we
    // don't need to do anything here and can just leave. if the status is
    // non-zero, though, then we need to report it.
    // (we may have warned about this earlier, if a situation justifies doing so)
    if (implicit && Module['noExitRuntime'] && status === 0) {
      return;
    }
  
    if (Module['noExitRuntime']) {
      // if exit() was called, we may warn the user if the runtime isn't actually being shut down
      if (!implicit) {
        err('exit(' + status + ') called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)');
      }
    } else {
  
      ABORT = true;
      EXITSTATUS = status;
  
      exitRuntime();
  
      if (Module['onExit']) Module['onExit'](status);
    }
  
    Module['quit'](status, new ExitStatus(status));
  }
  
  var abortDecorators = [];
  
  function abort(what) {
    if (Module['onAbort']) {
      Module['onAbort'](what);
    }
  
    if (what !== undefined) {
      out(what);
      err(what);
      what = JSON.stringify(what)
    } else {
      what = '';
    }
  
    ABORT = true;
    EXITSTATUS = 1;
  
    var extra = '';
    var output = 'abort(' + what + ') at ' + stackTrace() + extra;
    if (abortDecorators) {
      abortDecorators.forEach(function(decorator) {
        output = decorator(output, what);
      });
    }
    throw output;
  }
  Module['abort'] = abort;
  
  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].pop()();
    }
  }
  
  
    Module["noExitRuntime"] = true;
  
  run();
  
  
  
  
  
  // {{MODULE_ADDITIONS}}
  
  
  
  
  
    return rhino3dm
  }
  );
  })();
  if (typeof exports === 'object' && typeof module === 'object')
        module.exports = rhino3dm;
      else if (typeof define === 'function' && define['amd'])
        define([], function() { return rhino3dm; });
      else if (typeof exports === 'object')
        exports["rhino3dm"] = rhino3dm;
      