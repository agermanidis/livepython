import React, { Component } from "react";
import { ipcRenderer } from "electron";

function truncateString(str, num) {
  if (num < str.length) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}

function arrDiff (a1, a2) {
    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
};

class VariableInspector extends Component {
  constructor() {
    super();
    this.state = {
      filter: "",
      hideModules: true,
      variables: {},
      recentlyChanged: {}
    };
  }

  componentWillMount () {
    ipcRenderer.send('command', {
         type: 'connected'
    })
     ipcRenderer.on('trace', (event, data) => {
         const msg = JSON.parse(data.msg)
         if (msg.type === 'call') {
            this.setState({
                variables: Object.assign(
                    msg.frame_locals,
                    msg.frame_globals
                ),
                prevVariables: Object.assign(this.state.variables),
                recentlyChanged: arrDiff(
                    Object.keys(msg.frame_locals).concat(Object.keys(msg.frame_globals)),
                    Object.keys(this.state.variables)
                )
            });
         }
        })
    }

  getKeys() {
    var keys = Object.keys(this.state.variables);
    var filtered = [];
    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      var type = this.state.variables[name].type;
      if (this.state.hideModules && (type === "module" ||
                                     type === "function" ||
                                     type === "classobj" || 
                                     type === '_Feature' ||
                                     type === 'type')) {
        continue;
      }
      if (!this.state.filter || keys[i].startsWith(this.state.filter)) {
        filtered.push(keys[i]);
      }
    }
    return filtered;
  }

  filterChange (evt) {
    this.setState({ filter: evt.target.value || null });
  }

  toggleModuleHide() {
    this.setState({ hideModules: !this.state.hideModules });
  }

  componentDidMount() {
    this.searchInput.focus();
  }

  render() {
    var keys = this.getKeys();
    var rows = [];
    for (var i = 0; i < keys.length; i++) {
      var name = keys[i];
      var type = this.state.variables[name].type;
      var value = this.state.variables[name].value;
      var cs = 'variable-line'
      console.log(this.state.prevVariables[name], this.state.variables[name]);
      if (this.state.prevVariables[name] && this.state.prevVariables[name].value !== this.state.variables[name].value) {
        cs += " selected-line";
      }
      console.log(value, typeof value)
      rows.push(<tr key={name} className={cs}>
          <td>{name}</td>
          <td>{type}</td>
          <td>{truncateString(value.toString(), 30)}</td>
        </tr>);
    }
    return <div id="variables-view">
        <input id="variable-search" placeholder="Search for a variable" type="text" onChange={this.filterChange.bind(this)} ref={input => {
            this.searchInput = input;
          }} />
        <div style={{ margin: "10px" }}>
          <input checked={this.state.hideModules} type="checkbox" onChange={() => this.setState(
                { hideModules: !this.state.hideModules }
              )} />
          Hide modules, functions, and classes
        </div>
        <table>
          <thead>
            <tr>
              <td style={{ width: "25%" }}>Name</td>
              <td style={{ width: "25%" }}>Type</td>
              <td style={{ width: "50%" }}>Value</td>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>;
  }
}

export default VariableInspector;
