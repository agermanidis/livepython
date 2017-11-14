![](https://i.imgur.com/GM8vrCz.png)
![](https://i.imgur.com/36oEh3R.gif)

## Livepython 
### Watch your Python run like a movie.

##### NOTE: Livepython is alpha software. It doesn't handle a lot of edge cases and features may change.

Livepython is a desktop app that lets you visually trace, in real-time, the execution of a Python program. In addition, it can track changes in global and local variables as your program is running. Livepython is meant to give you a quick grasp of a program's execution flow. It's less messy than sprinkling print statements throughout your code and simpler to use than debuggers/profilers. 

Livepython can be launched from the command-line as easily as:

    livepython [program] [args...]

**Controls:**

SPACE: Play/Pause the program.

Left/Right Arrow: Change speed of execution.

V: Open/Close Variable Inspector.

### Compatibility

| **Python Version** | **Compatible?** |
|-----------|---------------|
| 3.6       | ✅             |
| 3.5       | ✅             |
| 2.7       | ✅             |
| 2.6       | ❌             |

### Installation

    npm install livepython -g

### Development

<img src="https://i.imgur.com/QWc7MLT.png" width=500></img>

Livepython has 3 main components: 

* a Python [tracer](https://github.com/agermanidis/livepython/blob/master/tracer.py) that uses `sys.settrace()` to intercept every line of your program as it's being evaluated
* an [Electron app](https://github.com/agermanidis/livepython/blob/master/main.js) that is responsible for the rendering the Livepython frontend
* a node.js [gateway script](https://github.com/agermanidis/livepython/blob/master/bin/livepython) that manages communication between the frontend and the tracer 

If you want to make changes to Livepython, you will need to run [webpack](https://webpack.js.org/):

    webpack

Then you can test your built version of livepython by running:

    bin/livepython [your python program]

### License

MIT
