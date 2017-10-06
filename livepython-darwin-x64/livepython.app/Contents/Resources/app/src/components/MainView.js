import React, { Component } from 'react'
import { ipcRenderer } from 'electron'

import CodeView from './CodeView'

class MainView extends Component {
    constructor () {
        super()
        this.state = {
            state: "running",
            filename: null,
            function_name: null,
            lineno: 0,
            locals: {},
            source: "",
            exception: null,
            time: null,
        }
    }

    componentDidUpdate () {
        document.title = this.state.filename;
    }

    componentWillMount () {
        ipcRenderer.send('connected')
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
                    exception: {
                        message: msg.exception_message,
                        type: msg.exception_type,
                        lineno: msg.lineno
                    }
                })
            }
        })
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