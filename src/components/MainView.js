import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import jq from 'jquery'
import mousetrap from 'mousetrap'

import CodeView from './CodeView'

function showIndicator(name) {
  jq(".status-indicator").remove();
  const src = `images/${name}.png`
  var $img = jq("<img>");
  $img.attr("src", src);
  $img.addClass("status-indicator");
  jq("body").append($img);
  $img.fadeOut(1000, function() {
    $img.remove();
  });
}

class MainView extends Component {
    constructor () {
        super()
        this.state = {
            paused: false,
            state: "running",
            filename: null,
            function_name: null,
            lineno: 0,
            locals: {},
            source: "",
            exception: null,
            time: null,
            fastForward: false
        }
    }

    componentDidUpdate () {
        document.title = 'Livepython - ' + this.state.filename;
    }

    componentWillMount () {
        ipcRenderer.send('command', {
            type: 'connected'
        })
        ipcRenderer.on('trace', (event, data) => {
            const msg = JSON.parse(data.msg)
            if (msg.type === 'call') {
                this.setState(Object.assign(this.state, msg))
            } else if (msg.type === 'switch') {
                this.setState(Object.assign(this.state, msg));
            } else if (msg.type === 'finish') {
                this.setState({state: 'finished'})
            } else if (msg.type === 'exception') {
                this.setState({
                    state: 'failed',
                    exception: {
                        message: msg.exception_message,
                        type: msg.exception_type,
                        lineno: msg.lineno
                    }
                })
            }
        })

        mousetrap.bind("space", (evt) => {
            const {paused} = this.state;
            showIndicator(paused ? 'play' : 'pause');
            ipcRenderer.send('command', {
                type: "toggle_running_state",
                value: !paused
            });
            this.setState({paused: !this.state.paused})
            return false;
        });

        mousetrap.bind("right", evt => {
            showIndicator('fastforward');
            ipcRenderer.send('command', {
                type: 'change_speed',
                speed: 'fast'
            });
            this.setState({ fastForward: true });
            return false;
        });

        mousetrap.bind("left", evt => {
          showIndicator("play");
          ipcRenderer.send('command', {
              type: "change_speed",
              speed: "slow"
           });
          this.setState({ fastForward: false });
          return false;
        });
        
        mousetrap.bind("v", evt => {
          ipcRenderer.send("toggle_variable_inspector");
          return false;
        });
    }


    render () {
        if (!this.state.source) return <p>Loading</p>
        return (
            <div>
                <CodeView {...this.state} />
            </div>
        )
    }
}

export default MainView